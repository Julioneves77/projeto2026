import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import type { UserData, MetaData } from '@/lib/storage';
interface PrivateDocumentPreviewProps {
  userData: Partial<UserData>;
  meta: Partial<MetaData>;
  isLocked?: boolean;
}
export function PrivateDocumentPreview({
  userData,
  meta,
  isLocked = false
}: PrivateDocumentPreviewProps) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/status?protocolo=${meta.protocolo || 'PENDENTE'}`;

  // Calculate completion
  const isPessoaJuridica = userData.tipoPessoa === 'Pessoa Jurídica';
  const docField = isPessoaJuridica ? userData.cnpj : userData.cpf;
  const filledFields = [userData.nome, docField, userData.email, userData.whatsapp, userData.uf].filter(Boolean).length;
  const isComplete = filledFields >= 5;
  return <div className="relative">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }} className="relative bg-white rounded-lg shadow-document overflow-hidden border border-gray-200" style={{
      aspectRatio: '210/280',
      maxHeight: '700px'
    }}>
        {/* Watermark - subtle background pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-repeat opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        </div>

        {/* Document content */}
        <div className="relative z-10 h-full flex flex-col p-3 sm:p-5 text-[11px] sm:text-xs text-gray-800">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-300 pb-3 sm:pb-4 mb-3 sm:mb-4">
            {/* Shield icon */}
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
            
            {/* Title - Clear and clean */}
            <div className="space-y-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-800 tracking-wider uppercase">
                Sistema de Processamento
              </p>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-wide uppercase">
                Criminal Federal 
              </h2>
              <motion.p key={meta.protocolo} initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="text-[11px] sm:text-xs text-gray-600 font-mono">
                Nº {meta.protocolo || '--------/----'}
              </motion.p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-2 sm:space-y-3">
            {/* Certificate statement */}
            <div className="text-[10px] sm:text-[11px] leading-relaxed text-gray-700">
              <p>
                <span className="font-bold">CERTIFICAMOS</span> que, conforme consulta realizada aos registros do sistema, 
                <span className="font-bold text-green-700"> NADA CONSTA</span> em desfavor de:
              </p>
            </div>

            {/* User data section - Clean box */}
            <div className="bg-gray-50 rounded-md p-2 sm:p-3 border border-gray-200">
              <motion.p key={userData.nome} initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="font-bold text-gray-900 text-xs sm:text-sm uppercase">
                {userData.nome || '---'}
              </motion.p>
              
              <p className="text-gray-400 text-[9px] sm:text-[10px] mt-1.5 mb-0.5">OU</p>
              
              <motion.p key={isPessoaJuridica ? userData.cnpj : userData.cpf} initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="font-semibold text-gray-800 text-[10px] sm:text-[11px]">
                {isPessoaJuridica ? 'CNPJ' : 'CPF'} n. {isPessoaJuridica ? (userData.cnpj || '---') : (userData.cpf || '---')}
              </motion.p>
            </div>

            {/* Info paragraph */}
            <div className="text-[9px] sm:text-[10px] leading-relaxed text-gray-600">
              <p>
                Registro em {currentDate}, às {currentTime}, 
                unidade federativa: <span className="font-semibold">{userData.uf || '---'}</span>.
              </p>
            </div>

            {/* Observations - Subtle */}
            <div className="text-[8px] sm:text-[9px] text-gray-400 space-y-0.5">
              <p className="font-semibold text-gray-500">Observações:</p>
              <p>a) Verificação disponível por 90 dias;</p>
              <p>b) Dados conforme informados pelo solicitante;</p>
              <p>c) Processamento de responsabilidade do titular.</p>
            </div>

            {/* Footer info */}
            <div className="mt-auto pt-2 border-t border-gray-200">
              <div className="flex justify-between items-end gap-2">
                <div className="space-y-0.5 text-[8px] sm:text-[9px] flex-1 min-w-0">
                  <div className="flex gap-2">
                    <span className="text-gray-500 shrink-0">Protocolo:</span>
                    <motion.span key={meta.protocolo} initial={{
                    opacity: 0
                  }} animate={{
                    opacity: 1
                  }} className="font-mono text-gray-800 truncate">
                      {meta.protocolo || '--------'}
                    </motion.span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 shrink-0">E-mail:</span>
                    <motion.span key={userData.email} initial={{
                    opacity: 0
                  }} animate={{
                    opacity: 1
                  }} className="text-gray-800 truncate">
                      {userData.email || '---'}
                    </motion.span>
                  </div>
                  <div className="text-gray-400 text-[7px] sm:text-[8px]">
                    {currentDate}
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="bg-white p-1 rounded border border-gray-300 shrink-0 blur-[1px]">
                  <QRCodeSVG value={qrUrl} size={40} level="L" bgColor="white" fgColor="#374151" />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Locked overlay */}
        {isLocked && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[3px] flex items-center justify-center">
            <div className="bg-white rounded-2xl p-4 sm:p-6 text-center shadow-elevated border border-gray-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">LIBERAÇÃO PENDENTE</h4>
              <p className="text-[10px] sm:text-xs text-gray-500">Disponível após confirmação</p>
            </div>
          </motion.div>}
      </motion.div>
    </div>;
}