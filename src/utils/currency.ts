/**
 * Formatea montos numéricos al formato monetario consistente ($ XX,XXX.XX).
 */
export function formatCurrency(value: number, showSign = false): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absFormatted = Math.abs(safeValue).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSign) {
    const sign = safeValue >= 0 ? '+' : '-';
    return `${sign}$${absFormatted}`;
  }

  return safeValue < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
}
