export type Language = 'en' | 'es' | 'ar';

export interface RechargeCardTranslations {
  title: string;
  code: string;
  amount: string;
  instructions: string;
  goodLuck: string;
  scanOrEnter: string;
  toRecharge: string;
  copyMessage: (code: string, amount: number) => string;
}

export interface CardsAdminTranslations {
  title: string;
  generateCard: string;
  cardGenerated: string;
  generateRechargeCard: string;
  amountLabel: string;
  cancel: string;
  generating: string;
  downloadText: string;
  downloadImage: string;
  close: string;
  copyWithMessage: string;
  total: string;
  unused: string;
  used: string;
  sold: string;
  totalValue: string;
  soldValue: string;
  status: string;
  created: string;
  usedAt: string;
  available: string;
  loading: string;
}

export interface CommonTranslations {
  backToDashboard: string;
  casinoAdmin: string;
}

export interface Translations {
  rechargeCard: RechargeCardTranslations;
  cardsAdmin: CardsAdminTranslations;
  common: CommonTranslations;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Recharge Cards
    rechargeCard: {
      title: 'RECHARGE CARD',
      code: 'Code',
      amount: 'Amount',
      instructions: 'Enter this code in the game to recharge your balance.',
      goodLuck: 'Good luck!',
      scanOrEnter: 'Scan QR or enter code',
      toRecharge: 'in game to recharge',
      copyMessage: (code: string, amount: number) =>
        `🎰 RECHARGE CARD 🎰\n\nCode: ${code}\nAmount: $${amount}\n\nEnter this code in the game to recharge your balance.\nGood luck!`,
    },
    // Cards Admin Page
    cardsAdmin: {
      title: 'Recharge Cards',
      generateCard: 'Generate Card',
      cardGenerated: 'Card Generated',
      generateRechargeCard: 'Generate Recharge Card',
      amountLabel: 'Amount ($)',
      cancel: 'Cancel',
      generating: 'Generating...',
      downloadText: 'Download as Text',
      downloadImage: 'Download as Image',
      close: 'Close',
      copyWithMessage: 'Copy with message',
      // Stats
      total: 'Total',
      unused: 'Unused',
      used: 'Used',
      sold: 'Sold',
      totalValue: 'Total Value',
      soldValue: 'Sold Value',
      // Table
      status: 'Status',
      created: 'Created',
      usedAt: 'Used At',
      available: 'Available',
      loading: 'Loading cards...',
    },
    // Common
    common: {
      backToDashboard: 'Back to Dashboard',
      casinoAdmin: 'Casino Admin',
    },
  },
  es: {
    // Recharge Cards
    rechargeCard: {
      title: 'TARJETA DE RECARGA',
      code: 'Código',
      amount: 'Monto',
      instructions: 'Ingresa este código en el juego para recargar tu saldo.',
      goodLuck: '¡Buena suerte!',
      scanOrEnter: 'Escanea el QR o ingresa el código',
      toRecharge: 'en el juego para recargar',
      copyMessage: (code: string, amount: number) =>
        `🎰 TARJETA DE RECARGA 🎰\n\nCódigo: ${code}\nMonto: $${amount}\n\nIngresa este código en el juego para recargar tu saldo.\n¡Buena suerte!`,
    },
    // Cards Admin Page
    cardsAdmin: {
      title: 'Tarjetas de Recarga',
      generateCard: 'Generar Tarjeta',
      cardGenerated: 'Tarjeta Generada',
      generateRechargeCard: 'Generar Tarjeta de Recarga',
      amountLabel: 'Monto ($)',
      cancel: 'Cancelar',
      generating: 'Generando...',
      downloadText: 'Descargar como Texto',
      downloadImage: 'Descargar como Imagen',
      close: 'Cerrar',
      copyWithMessage: 'Copiar con mensaje',
      // Stats
      total: 'Total',
      unused: 'Sin Usar',
      used: 'Usadas',
      sold: 'Vendidas',
      totalValue: 'Valor Total',
      soldValue: 'Valor Vendido',
      // Table
      status: 'Estado',
      created: 'Creada',
      usedAt: 'Usada',
      available: 'Disponible',
      loading: 'Cargando tarjetas...',
    },
    // Common
    common: {
      backToDashboard: 'Volver al Panel',
      casinoAdmin: 'Admin Casino',
    },
  },
  ar: {
    // Recharge Cards
    rechargeCard: {
      title: 'بطاقة إعادة الشحن',
      code: 'الرمز',
      amount: 'المبلغ',
      instructions: 'أدخل هذا الرمز في اللعبة لإعادة شحن رصيدك.',
      goodLuck: 'حظاً موفقاً!',
      scanOrEnter: 'امسح رمز QR أو أدخل الرمز',
      toRecharge: 'في اللعبة لإعادة الشحن',
      copyMessage: (code: string, amount: number) =>
        `🎰 بطاقة إعادة الشحن 🎰\n\nالرمز: ${code}\nالمبلغ: $${amount}\n\nأدخل هذا الرمز في اللعبة لإعادة شحن رصيدك.\nحظاً موفقاً!`,
    },
    // Cards Admin Page
    cardsAdmin: {
      title: 'بطاقات إعادة الشحن',
      generateCard: 'إنشاء بطاقة',
      cardGenerated: 'تم إنشاء البطاقة',
      generateRechargeCard: 'إنشاء بطاقة إعادة شحن',
      amountLabel: 'المبلغ ($)',
      cancel: 'إلغاء',
      generating: 'جاري الإنشاء...',
      downloadText: 'تحميل كنص',
      downloadImage: 'تحميل كصورة',
      close: 'إغلاق',
      copyWithMessage: 'نسخ مع الرسالة',
      // Stats
      total: 'الإجمالي',
      unused: 'غير مستخدمة',
      used: 'مستخدمة',
      sold: 'مباعة',
      totalValue: 'القيمة الإجمالية',
      soldValue: 'قيمة المبيعات',
      // Table
      status: 'الحالة',
      created: 'تاريخ الإنشاء',
      usedAt: 'تاريخ الاستخدام',
      available: 'متاحة',
      loading: 'جاري تحميل البطاقات...',
    },
    // Common
    common: {
      backToDashboard: 'العودة للوحة التحكم',
      casinoAdmin: 'إدارة الكازينو',
    },
  },
};
