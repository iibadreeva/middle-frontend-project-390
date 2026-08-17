/** Сводка ошибок секции контактов: одно сообщение или склейка разных. */
export function contactSectionMessage(
  emailMessage: unknown,
  phoneMessage: unknown,
): string | undefined {
  const email = typeof emailMessage === 'string' ? emailMessage : undefined;
  const phone = typeof phoneMessage === 'string' ? phoneMessage : undefined;

  if (email && phone && email !== phone) {
    return `${email}. ${phone}`;
  }
  return email ?? phone;
}
