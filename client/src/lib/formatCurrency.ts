/**
 * Formata valor monetário no padrão: 46.000.00
 * - Ponto como separador de milhares
 * - Sempre termina com .00 (centavos fixos)
 * Exemplo: "46000" → "46.000.00"
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Pega o número inteiro
  const numberValue = parseInt(digits, 10);
  
  // Adiciona pontos como separadores de milhares
  const formatted = numberValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Sempre adiciona .00 no final
  return `${formatted}.00`;
}

/**
 * Converte valor formatado (46.000.00) para número puro (46000)
 */
export function parseCurrencyInput(value: string): number {
  // Remove todos os pontos (separadores de milhares e centavos)
  const cleaned = value.replace(/\./g, '');
  
  // Remove os últimos 2 dígitos (.00 fixo) não, na verdade são parte do número
  // Se "46.000.00" → "4600000" → precisa dividir por 100? Não!
  // "46.000.00" = 46000 reais (os .00 são apenas formatação visual)
  
  // Remove apenas os últimos 2 zeros (.00)
  const withoutCents = cleaned.slice(0, -2) || '0';
  
  const number = parseInt(withoutCents, 10);
  
  return isNaN(number) ? 0 : number;
}

/**
 * Formata número para exibição: R$ 46.000,00
 */
export function formatCurrencyDisplay(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
