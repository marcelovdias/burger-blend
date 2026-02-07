## Prompt de Melhorias para o Relatório de Produção do Burger Master Pro

**Contexto:** O relatório de produção atual, gerado via `window.print()`, já contém informações básicas do blend. No entanto, para torná-lo uma ferramenta profissional e eficiente para as equipes de açougue e cozinha (chapeiro), é fundamental adicionar e organizar melhor as informações.

**Objetivo:** Desenvolver um relatório de produção que seja claro, completo e contenha todas as informações necessárias para o preparo da carne e a cocção do hambúrguer, incluindo dados logísticos.

--- 

### Melhorias Propostas:

#### 1. Identificação e Rastreabilidade

*   **ID de Produção Persistente:** O ID atual (`{Math.random().toString(36).substr(2, 9).toUpperCase()}`) é gerado aleatoriamente. Para rastreabilidade, ele deve ser um ID persistente, gerado e armazenado no aplicativo (ex: LocalStorage ou um sistema de backend, se houver) no momento da criação do blend, e recuperado para a impressão. Sugere-se que o usuário possa visualizar e copiar este ID na interface principal.
*   **Data e Hora da Geração do Relatório:** Já presente, mas pode ser mais explícita (ex: "Gerado em: DD/MM/AAAA HH:MM").

#### 2. Informações Logísticas Essenciais

*   **Data e Hora da Entrega/Produção:** Atualmente, o relatório possui placeholders vazios para "Data de Entrega" e "Horário" (linhas 816-822 do `App.tsx`).
    *   **Ação:** Adicionar campos de entrada na interface principal do aplicativo (próximo ao botão de imprimir) onde o usuário possa inserir a data e hora desejadas para a entrega/produção. Esses valores devem ser então exibidos no relatório impresso.
    *   **Formato:** `DD/MM/AAAA` para a data e `HH:MM` para o horário.

#### 3. Detalhamento do Blend para o Açougueiro

O relatório já lista os ingredientes, proporções e pesos totais. Para o açougueiro, é crucial que estas informações sejam ainda mais claras e que haja espaço para instruções adicionais.

*   **Seção "Instruções para o Açougueiro":** Criar uma nova seção no relatório com um campo de texto editável na interface principal para que o usuário possa adicionar instruções específicas, como:
    *   "Separar carnes por tipo"
    *   "Embalar a vácuo individualmente"
    *   "Moer a gordura separadamente"
*   **Revisão da Tabela de Composição do Blend:** A tabela atual é boa. Garantir que o nome da carne, proporção e peso total estejam sempre visíveis e formatados de forma legível.

#### 4. Instruções de Cocção para o Chapeiro

Esta é uma informação completamente ausente e vital para a qualidade final do hambúrguer.

*   **Seção "Instruções para o Chapeiro":** Criar uma nova seção no relatório com um campo de texto editável na interface principal para que o usuário possa adicionar instruções de cocção, como:
    *   "Ponto da carne desejado (ex: malpassado, ao ponto)"
    *   "Temperatura da chapa"
    *   "Tempo de cocção por lado (se aplicável)"
    *   "Adicionar queijo nos últimos 30 segundos"
*   **Dicas de Elite Contextuais:** Considerar a possibilidade de integrar algumas das "Dicas de Elite" relevantes para a cocção (ex: "Não apertar o hambúrguer na chapa", "Selar o pão") nesta seção, talvez como um lembrete.

#### 5. Organização Visual e Layout

*   **Separação Clara de Seções:** Utilizar títulos, subtítulos e espaçamentos adequados para distinguir as seções de "Identificação", "Logística", "Para o Açougueiro" e "Para o Chapeiro".
*   **Espaço para Assinatura/Verificação:** Manter e, se possível, expandir o espaço para assinatura do responsável, garantindo que o relatório possa ser usado como um checklist de produção.
*   **Legibilidade:** Assegurar que as fontes e tamanhos de texto sejam otimizados para impressão, mesmo em impressoras de baixa qualidade.

--- 

**Implementação Técnica (Sugestões):**

*   As alterações no layout de impressão serão principalmente no bloco `@media print` e na estrutura do `div` com a classe `print-only` dentro de `App.tsx`.
*   Novos estados e inputs precisarão ser adicionados ao componente principal para capturar a data/hora de entrega e as instruções personalizadas.
*   A passagem desses dados para o componente de impressão deve ser feita via props ou contexto, garantindo que estejam disponíveis no momento da renderização para impressão.

Ao implementar essas melhorias, o relatório de produção do Burger Master Pro se tornará uma ferramenta indispensável para otimizar o fluxo de trabalho e garantir a consistência e qualidade dos hambúrgueres produzidos.
