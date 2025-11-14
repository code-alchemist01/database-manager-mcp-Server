import { ProjectManagerServer } from './server.js';
import { registerProjectAnalysisTools } from './tools/project-analysis.js';
import { registerCodeMetricsTools } from './tools/code-metrics.js';
import { registerDocumentationTools } from './tools/documentation.js';
import { registerGitAnalysisTools } from './tools/git-analysis.js';
import { registerProjectOrgTools } from './tools/project-org.js';

async function main() {
  const server = new ProjectManagerServer();

  // Register all tool categories
  registerProjectAnalysisTools(server);
  registerCodeMetricsTools(server);
  registerDocumentationTools(server);
  registerGitAnalysisTools(server);
  registerProjectOrgTools(server);

  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

