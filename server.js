const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Create a temp directory for test results
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

app.post('/run-test', (req, res) => {
  const { repoUrl, branch, testCommand, gradlewPath } = req.body;
  
  if (!repoUrl || !branch || !testCommand) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const testId = Date.now().toString();
  const workDir = path.join(resultsDir, testId);
  
  // Create a directory for this test
  fs.mkdirSync(workDir);
  
  console.log(`Starting test ${testId} for ${repoUrl} (${branch})`);
  
  // Clone repository
  exec(`git clone ${repoUrl} ${workDir} && cd ${workDir} && git checkout ${branch} && chmod +x ${gradlewPath}`, (cloneErr) => {
    if (cloneErr) {
      console.error(`Error cloning repository: ${cloneErr}`);
      return res.status(500).json({ error: 'Failed to clone repository', details: cloneErr.message });
    }

    console.log(workDir);
    
    // Execute test command
    exec(testCommand, { cwd: workDir }, (testErr, stdout, stderr) => {
      const results = {
        testId,
        success: !testErr,
        stdout,
        stderr,
        exitCode: testErr ? testErr.code : 0
      };
      
      // Save results to a file
      fs.writeFileSync(path.join(workDir, 'results.json'), JSON.stringify(results, null, 2));
      
      // Return results
      res.json(results);
      
      console.log(`Test ${testId} completed with exit code ${results.exitCode}`);
    });
  });
});

// Endpoint to get test results
app.get('/test-results/:testId', (req, res) => {
  const testId = req.params.testId;
  const resultsFile = path.join(resultsDir, testId, 'results.json');
  
  if (fs.existsSync(resultsFile)) {
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    res.json(results);
  } else {
    res.status(404).json({ error: 'Test results not found' });
  }
});

app.listen(port, () => {
  console.log(`Test runner server listening at http://localhost:${port}`);
});
