import Layout from "@/components/layout/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "O que é uma certidão de antecedentes criminais?",
    answer: "A certidão de antecedentes criminais é um documento oficial que comprova a existência ou inexistência de registros criminais em nome de uma pessoa. É frequentemente exigida para processos de emprego, concursos públicos, viagens internacionais, entre outras finalidades.",
  },
  {
    question: "Qual a diferença entre certidão estadual e federal?",
    answer: "A certidão estadual é emitida pelos Tribunais de Justiça de cada estado e contém informações sobre processos na Justiça Estadual. Já a certidão federal é emitida pelos Tribunais Regionais Federais e abrange processos na Justiça Federal. Para uma análise completa, geralmente são solicitadas ambas.",
  },
  {
    question: "Quanto tempo leva para receber minha certidão?",
    answer: "O prazo varia de acordo com o tipo de certidão e o órgão emissor. Algumas certidões são emitidas em tempo real, enquanto outras podem levar de 1 a 5 dias úteis. Após o processamento, a certidão é enviada diretamente para seu e-mail.",
  },
  {
    question: "A certidão tem validade?",
    answer: "Sim, a maioria das certidões tem validade de 90 dias a partir da data de emissão. No entanto, a validade pode variar dependendo da finalidade e do órgão que está solicitando o documento. Recomendamos verificar a exigência específica do seu caso.",
  },
  {
    question: "Posso solicitar certidão para outra pessoa?",
    answer: "Em geral, é necessário que o próprio interessado faça a solicitação, pois envolve dados pessoais sensíveis. Porém, em alguns casos específicos (como representação legal), é possível solicitar para terceiros mediante procuração ou documentação adequada.",
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos PIX (pagamento instantâneo), cartões de crédito das principais bandeiras e boleto bancário. O PIX oferece a forma mais rápida de liberação do serviço.",
  },
  {
    question: "O que é a CND (Certidão Negativa de Débitos)?",
    answer: "A CND é um documento que comprova a inexistência de débitos tributários federais em nome de uma pessoa física ou jurídica. É frequentemente exigida em processos de licitação, financiamentos, e operações imobiliárias.",
  },
  {
    question: "A certidão emitida é válida juridicamente?",
    answer: "Sim, as certidões são obtidas diretamente dos órgãos oficiais competentes (Tribunais de Justiça, TRFs, Polícia Federal, Receita Federal) e possuem a mesma validade jurídica das emitidas presencialmente.",
  },
];

const FAQ = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient py-16 lg:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center animate-slide-up">
            <h1 className="font-heading text-4xl font-bold text-primary-foreground sm:text-5xl">
              Perguntas Frequentes
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Encontre respostas para as dúvidas mais comuns
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="rounded-xl border border-border bg-card px-6 card-shadow animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AccordionTrigger className="text-left font-heading font-semibold text-foreground hover:text-primary hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Não encontrou sua resposta?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nossa equipe está pronta para ajudar você com qualquer dúvida.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to="/contato">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Fale Conosco
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
