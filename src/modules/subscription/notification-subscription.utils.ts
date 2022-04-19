export const generateNotificationText = (
  rentOrSale: string,
  apartmentListLength: number,
): string => {
  const rentOrSaleLabel = rentOrSale === 'rent' ? 'iznajmljivanje' : 'kupovinu';
  if (apartmentListLength === 1) return `1 novi stan za ${rentOrSaleLabel}`;
  if (apartmentListLength <= 4)
    return `${apartmentListLength} nova stana za ${rentOrSaleLabel}`;
  return `${apartmentListLength} novih stanova za ${rentOrSaleLabel}`;
};
