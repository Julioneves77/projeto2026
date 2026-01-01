/**
 * Script de teste manual para SendPulse e Zap API
 * Testa envio de email e WhatsApp isoladamente
 */

require('dotenv').config();
const sendPulseService = require('./services/sendPulseService');
const zapApiService = require('./services/zapApiService');
const fs = require('fs');
const path = require('path');

// Dados de teste simulando um ticket
const ticketTeste = {
  id: 'test-ticket-' + Date.now(),
  codigo: 'TK-TEST',
  nomeCompleto: 'JULIO CESAR NEVES DE SOUZA',
  email: 'juliocesarnevesdesouza@gmail.com', // Use seu email real para teste
  telefone: '5511999999999', // Use seu telefone real para teste
  tipoCertidao: 'eleitoral',
  prioridade: 'premium',
  status: 'CONCLUIDO'
};

const mensagemInteracao = 'Sua certidão foi emitida com sucesso! Segue em anexo.';

// Criar um arquivo PDF de teste pequeno (base64)
const anexoTeste = {
  nome: 'JULIO_CESAR_NEVES_DE_SOUZA_Certidao_Eleitoral.pdf',
  tipo: 'application/pdf',
  base64: 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzAgNzAwIFRkCihUZXN0ZSBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMTc3IDAwMDAwIG4gCjAwMDAwMDAzNjEgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NDMKJSVFT0Y=' // PDF mínimo válido em base64
};

async function testarSendPulse() {
  console.log('\n📧 ========== TESTE SENDPULSE ==========\n');
  
  try {
    console.log('📧 Enviando email de teste...');
    console.log('📧 Destinatário:', ticketTeste.email);
    console.log('📧 Ticket:', ticketTeste.codigo);
    
    const resultado = await sendPulseService.sendCompletionEmail(
      ticketTeste,
      mensagemInteracao,
      anexoTeste
    );
    
    console.log('\n📧 Resultado:', JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      console.log('\n✅ Email enviado com sucesso!');
      console.log('📧 Verifique sua caixa de entrada:', ticketTeste.email);
    } else {
      console.log('\n❌ Erro ao enviar email:', resultado.error);
    }
  } catch (error) {
    console.error('\n❌ Erro no teste SendPulse:', error);
    console.error('Stack:', error.stack);
  }
}

async function testarZapAPI() {
  console.log('\n📱 ========== TESTE ZAP API ==========\n');
  
  try {
    console.log('📱 Enviando WhatsApp de teste...');
    console.log('📱 Destinatário:', ticketTeste.telefone);
    console.log('📱 Ticket:', ticketTeste.codigo);
    
    const resultado = await zapApiService.sendCompletionWhatsApp(
      ticketTeste,
      mensagemInteracao,
      anexoTeste
    );
    
    console.log('\n📱 Resultado:', JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      console.log('\n✅ WhatsApp enviado com sucesso!');
      console.log('📱 Verifique seu WhatsApp:', ticketTeste.telefone);
    } else {
      console.log('\n❌ Erro ao enviar WhatsApp:', resultado.error);
    }
  } catch (error) {
    console.error('\n❌ Erro no teste Zap API:', error);
    console.error('Stack:', error.stack);
  }
}

async function executarTestes() {
  console.log('🧪 ========== INICIANDO TESTES ==========\n');
  console.log('📋 Configurações:');
  console.log('   SendPulse Client ID:', process.env.SENDPULSE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado');
  console.log('   SendPulse Sender Email:', process.env.SENDPULSE_SENDER_EMAIL || 'Não configurado');
  console.log('   Zap API URL:', process.env.ZAP_API_URL || 'Não configurado');
  console.log('   Zap API Key:', process.env.ZAP_API_KEY ? '✅ Configurado' : '❌ Não configurado');
  console.log('   Zap Client Token:', process.env.ZAP_CLIENT_TOKEN ? '✅ Configurado' : '❌ Não configurado');
  console.log('');
  
  // Testar SendPulse
  await testarSendPulse();
  
  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Testar Zap API
  await testarZapAPI();
  
  console.log('\n✅ ========== TESTES CONCLUÍDOS ==========\n');
}

// Executar testes
executarTestes().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

