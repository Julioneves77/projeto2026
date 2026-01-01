/**
 * Teste manual do endpoint de conclusão
 * Simula conclusão de ticket e verifica se notificações são enviadas
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SYNC_SERVER_URL = 'http://localhost:3001';
const TICKETS_FILE = path.join(__dirname, 'tickets-data.json');

// Ler tickets do arquivo
function readTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = fs.readFileSync(TICKETS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao ler tickets:', error);
  }
  return [];
}

async function testarConclusao() {
  console.log('🧪 ========== TESTE MANUAL DE CONCLUSÃO ==========\n');
  
  // Ler tickets
  const tickets = readTickets();
  console.log(`📋 Total de tickets encontrados: ${tickets.length}`);
  
  if (tickets.length === 0) {
    console.log('❌ Nenhum ticket encontrado. Crie um ticket primeiro.');
    return;
  }
  
  // Encontrar um ticket que pode ser concluído
  // Preferir tickets que não estão concluídos ainda
  let ticketParaTeste = tickets.find(t => t.status !== 'CONCLUIDO');
  
  if (!ticketParaTeste) {
    // Se todos estão concluídos, usar o último
    ticketParaTeste = tickets[tickets.length - 1];
    console.log(`⚠️ Todos os tickets estão concluídos. Usando último ticket: ${ticketParaTeste.codigo}`);
  } else {
    console.log(`✅ Ticket encontrado para teste: ${ticketParaTeste.codigo}`);
  }
  
  console.log(`📋 Ticket: ${ticketParaTeste.codigo}`);
  console.log(`📋 Status atual: ${ticketParaTeste.status}`);
  console.log(`📋 Email: ${ticketParaTeste.email || 'NÃO DISPONÍVEL'}`);
  console.log(`📋 Telefone: ${ticketParaTeste.telefone || 'NÃO DISPONÍVEL'}`);
  console.log(`📋 Prioridade: ${ticketParaTeste.prioridade || 'padrao'}`);
  console.log('');
  
  // Primeiro, atualizar ticket para CONCLUIDO se necessário
  if (ticketParaTeste.status !== 'CONCLUIDO') {
    console.log('📝 Atualizando ticket para CONCLUIDO...');
    try {
      const updateResponse = await axios.put(
        `${SYNC_SERVER_URL}/tickets/${ticketParaTeste.id}`,
        {
          status: 'CONCLUIDO',
          dataConclusao: new Date().toISOString()
        }
      );
      console.log('✅ Ticket atualizado para CONCLUIDO');
    } catch (error) {
      console.error('❌ Erro ao atualizar ticket:', error.response?.data || error.message);
      return;
    }
    
    // Aguardar um pouco para garantir que foi salvo
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Criar anexo de teste (PDF mínimo)
  const anexoTeste = {
    nome: `${ticketParaTeste.nomeCompleto.replace(/[^a-zA-Z0-9]/g, '_')}_Certidao_Teste.pdf`,
    tipo: 'application/pdf',
    base64: 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzAgNzAwIFRkCihUZXN0ZSBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNzQgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMTc3IDAwMDAwIG4gCjAwMDAwMDAzNjEgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NDMKJSVFT0Y='
  };
  
  const mensagemInteracao = 'Sua certidão foi emitida com sucesso! Segue em anexo.';
  
  console.log('📧 Enviando requisição de conclusão...');
  console.log(`📧 Endpoint: ${SYNC_SERVER_URL}/tickets/${ticketParaTeste.id}/send-completion`);
  console.log(`📧 Mensagem: ${mensagemInteracao}`);
  console.log(`📧 Anexo: ${anexoTeste.nome}`);
  console.log('');
  
  try {
    const response = await axios.post(
      `${SYNC_SERVER_URL}/tickets/${ticketParaTeste.id}/send-completion`,
      {
        mensagemInteracao: mensagemInteracao,
        anexo: anexoTeste
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 segundos de timeout
      }
    );
    
    console.log('✅ Resposta recebida:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.success) {
      console.log('✅ Notificações processadas com sucesso!');
      if (response.data.email?.success) {
        console.log('✅ Email enviado');
      } else {
        console.log('❌ Email não enviado:', response.data.email?.error || 'Erro desconhecido');
      }
      if (response.data.whatsapp?.success) {
        console.log('✅ WhatsApp enviado');
      } else if (response.data.whatsapp?.skipped) {
        console.log('⏭️ WhatsApp não enviado (tipo padrão)');
      } else {
        console.log('❌ WhatsApp não enviado:', response.data.whatsapp?.error || 'Erro desconhecido');
      }
    } else {
      console.log('❌ Erro ao processar notificações');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar requisição:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data || {}, null, 2));
    console.error('Message:', error.message);
  }
  
  console.log('\n✅ ========== TESTE CONCLUÍDO ==========');
}

// Executar teste
testarConclusao().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

