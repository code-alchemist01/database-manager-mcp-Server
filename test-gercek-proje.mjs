import { ProjectManagerServer } from './dist/server.js';
import { registerProjectAnalysisTools } from './dist/tools/project-analysis.js';
import { registerCodeMetricsTools } from './dist/tools/code-metrics.js';
import { registerDocumentationTools } from './dist/tools/documentation.js';
import { registerGitAnalysisTools } from './dist/tools/git-analysis.js';
import { registerProjectOrgTools } from './dist/tools/project-org.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// KENDİ PROJEMİZİ ANALİZ EDELİM
const projectPath = __dirname;

console.log('🔍 GERÇEK PROJE ANALİZİ - MCP Project Manager\n');
console.log('='.repeat(70));
console.log(`Proje: ${projectPath}\n`);

// Server oluştur
const server = new ProjectManagerServer();
registerProjectAnalysisTools(server);
registerCodeMetricsTools(server);
registerDocumentationTools(server);
registerGitAnalysisTools(server);
registerProjectOrgTools(server);

const tools = Array.from(server.tools.values());

// Önemli tool'ları test et
async function testRealProject() {
  console.log('📊 1. PROJE YAPISI ANALİZİ\n');
  try {
    const tool = tools.find(t => t.name === 'analyze_project_structure');
    const result = await tool.handler({ path: projectPath, depth: 3 });
    console.log(result.substring(0, 500));
    console.log('...\n');
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔧 2. TEKNOLOJİ STACK TESPİTİ\n');
  try {
    const tool = tools.find(t => t.name === 'detect_tech_stack');
    const result = await tool.handler({ path: projectPath });
    console.log(result);
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📈 3. PROJE METRİKLERİ\n');
  try {
    const tool = tools.find(t => t.name === 'get_project_metrics');
    const result = await tool.handler({ path: projectPath });
    console.log(result);
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔍 4. CODE SMELL TESPİTİ\n');
  try {
    const tool = tools.find(t => t.name === 'detect_code_smells');
    const result = await tool.handler({ path: projectPath });
    console.log(result.substring(0, 800));
    console.log('...\n');
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📝 5. DOSYA YAPISI ÖNERİLERİ\n');
  try {
    const tool = tools.find(t => t.name === 'suggest_file_structure');
    const result = await tool.handler({ path: projectPath });
    console.log(result);
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📦 6. BAĞIMLILIK ANALİZİ\n');
  try {
    const tool = tools.find(t => t.name === 'analyze_dependencies');
    const result = await tool.handler({ path: projectPath });
    console.log(result.substring(0, 600));
    console.log('...\n');
  } catch (error) {
    console.error('❌ HATA:', error.message);
  }

  // Git varsa test et
  console.log('\n' + '='.repeat(70));
  console.log('🔀 7. GIT ANALİZİ (Eğer git repository ise)\n');
  try {
    const tool = tools.find(t => t.name === 'analyze_commits');
    const result = await tool.handler({ path: projectPath, limit: 5 });
    console.log(result);
  } catch (error) {
    console.log('⚠️  Git repository değil veya commit yok (normal olabilir)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ GERÇEK PROJE TESTİ TAMAMLANDI!\n');
  console.log('Yukarıdaki sonuçlar gerçek proje analizinden geliyor.');
  console.log('Eğer sonuçlar mantıklı ve doğru görünüyorsa, MCP server çalışıyor demektir!');
}

testRealProject().catch(error => {
  console.error('Test hatası:', error);
  process.exit(1);
});

