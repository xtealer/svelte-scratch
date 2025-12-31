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
  copyText: string;
  downloadImage: string;
  close: string;
  copyCode: string;
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
  markAsSold: string;
  actions: string;
}

export interface CommonTranslations {
  backToDashboard: string;
  casinoAdmin: string;
  welcome: string;
  loading: string;
  error: string;
  save: string;
  edit: string;
  delete: string;
  confirm: string;
  today: string;
  thisMonth: string;
  date: string;
  notes: string;
  login: string;
  loggingIn: string;
  username: string;
  password: string;
  backToGames: string;
}

export interface DashboardTranslations {
  title: string;
  totalRevenue: string;
  totalSales: string;
  totalPayouts: string;
  netProfit: string;
  positive: string;
  negative: string;
  rechargeCards: string;
  payoutRequests: string;
  pending: string;
  paid: string;
  viewRequests: string;
  gameStatistics: string;
  totalPlays: string;
  wins: string;
  losses: string;
  winRate: string;
  prizesPaid: string;
  prizeDistribution: string;
  prize: string;
  count: string;
  expectedOdds: string;
  actualOdds: string;
  under: string;
  over: string;
  normal: string;
  recentSales: string;
  recentPayouts: string;
  noSalesYet: string;
  noPayoutsYet: string;
  seller: string;
  paidBy: string;
}

export interface SalesTranslations {
  title: string;
  allSellers: string;
  totalRevenue: string;
  totalSales: string;
  topSellers: string;
  sales: string;
  recentSales: string;
  noSalesYet: string;
  code: string;
  plays: string;
  price: string;
  seller: string;
  date: string;
}

export interface PayoutsTranslations {
  title: string;
  registerPayout: string;
  pendingRequests: string;
  totalPaidOut: string;
  requests: string;
  completedPayouts: string;
  registerPrizePayment: string;
  code: string;
  amount: string;
  notesOptional: string;
  processing: string;
  payoutRequests: string;
  pending: string;
  approved: string;
  paid: string;
  rejected: string;
  all: string;
  noRequests: string;
  approve: string;
  reject: string;
  markAsPaid: string;
  recentPayouts: string;
  player: string;
  paidBy: string;
  noPayoutsYet: string;
  processed: string;
  by: string;
  alreadyPaid: string;
  payoutRegistered: string;
}

export interface GamesTranslations {
  title: string;
  active: string;
  disabled: string;
  updated: string;
  gameStatusInfo: string;
  whenDisabled: string;
  cannotAccess: string;
  existingSessions: string;
  showMaintenance: string;
  loading: string;
}

export interface UsersTranslations {
  title: string;
  addUser: string;
  newUser: string;
  username: string;
  password: string;
  name: string;
  role: string;
  creating: string;
  createUser: string;
  super: string;
  admin: string;
  seller: string;
  active: string;
  inactive: string;
  lastLogin: string;
  never: string;
  viewStats: string;
  editUser: string;
  saveChanges: string;
  saving: string;
  newPassword: string;
  leaveBlank: string;
  stats: string;
  statsFor: string;
  totalRevenue: string;
  totalSales: string;
  loading: string;
}

export interface NavTranslations {
  dashboard: string;
  users: string;
  games: string;
  rechargeCards: string;
  sales: string;
  payouts: string;
  logout: string;
}

export interface FooterTranslations {
  copyright: string;
}

export interface GameMenuTranslations {
  title: string;
  subtitle: string;
  scratchTitle: string;
  scratchDesc: string;
  slotsTitle: string;
  slotsDesc: string;
  prizeText: string;
}

export interface GameUITranslations {
  backToMenu: string;
  endSession: string;
  mute: string;
  unmute: string;
  credit: string;
  bet: string;
  won: string;
  spin: string;
  code: string;
  enterCode: string;
  payTable: string;
  auto: string;
  on: string;
  off: string;
  claim: string;
  scratchAndWin: string;
  winUpTo: string;
  threeMatchWin: string;
  plays: string;
  winnings: string;
  reveal: string;
  next: string;
  newCode: string;
  youWon: string;
  youLost: string;
  prize: string;
  viewPrizes: string;
}

export interface NavbarTranslations {
  code: string;
  credits: string;
  winnings: string;
  endSession: string;
  confirmEndSession: string;
  balance: string;
  noCredits: string;
  enterCode: string;
}

export interface ClaimModalTranslations {
  requestSent: string;
  amountRequested: string;
  payoutInfo1: string;
  payoutInfo2: string;
  codeRef: string;
  creditsAdded: string;
  creditsAddedAmount: string;
  creditsInfo1: string;
  creditsInfo2: string;
  whatToDo: string;
  totalWinnings: string;
  fullName: string;
  phoneNumber: string;
  required: string;
  namePlaceholder: string;
  phonePlaceholder: string;
  nameError: string;
  phoneError: string;
  convertError: string;
  requestError: string;
  connectionError: string;
  completeInfo: string;
  sending: string;
  processing: string;
  requestPayout: string;
  convertToCredits: string;
  cancel: string;
  letsPlay: string;
  close: string;
}

export interface Translations {
  rechargeCard: RechargeCardTranslations;
  cardsAdmin: CardsAdminTranslations;
  common: CommonTranslations;
  dashboard: DashboardTranslations;
  sales: SalesTranslations;
  payouts: PayoutsTranslations;
  games: GamesTranslations;
  users: UsersTranslations;
  nav: NavTranslations;
  footer: FooterTranslations;
  gameMenu: GameMenuTranslations;
  gameUI: GameUITranslations;
  navbar: NavbarTranslations;
  claimModal: ClaimModalTranslations;
}

export const translations: Record<Language, Translations> = {
  en: {
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
    cardsAdmin: {
      title: 'Recharge Cards',
      generateCard: 'Generate Card',
      cardGenerated: 'Card Generated',
      generateRechargeCard: 'Generate Recharge Card',
      amountLabel: 'Amount ($)',
      cancel: 'Cancel',
      generating: 'Generating...',
      copyText: 'Copy Text',
      downloadImage: 'Download as Image',
      close: 'Close',
      copyCode: 'Copy Code',
      total: 'Total',
      unused: 'Unused',
      used: 'Used',
      sold: 'Sold',
      totalValue: 'Total Value',
      soldValue: 'Sold Value',
      status: 'Status',
      created: 'Created',
      usedAt: 'Used At',
      available: 'Available',
      loading: 'Loading cards...',
      markAsSold: 'Mark as Sold',
      actions: 'Actions',
    },
    common: {
      backToDashboard: 'Back to Dashboard',
      casinoAdmin: 'Casino Admin',
      welcome: 'Welcome',
      loading: 'Loading...',
      error: 'Error',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      today: 'Today',
      thisMonth: 'This Month',
      date: 'Date',
      notes: 'Notes',
      login: 'Login',
      loggingIn: 'Logging in...',
      username: 'Username',
      password: 'Password',
      backToGames: 'Back to Games',
    },
    dashboard: {
      title: 'Dashboard',
      totalRevenue: 'Total Revenue',
      totalSales: 'Total Sales',
      totalPayouts: 'Total Payouts',
      netProfit: 'Net Profit',
      positive: 'Positive',
      negative: 'Negative',
      rechargeCards: 'Recharge Cards',
      payoutRequests: 'Payout Requests',
      pending: 'Pending',
      paid: 'Paid',
      viewRequests: 'View Requests',
      gameStatistics: 'Game Statistics',
      totalPlays: 'Total Plays',
      wins: 'Wins',
      losses: 'Losses',
      winRate: 'Win Rate',
      prizesPaid: 'Prizes Paid',
      prizeDistribution: 'Prize Distribution (Actual vs Expected)',
      prize: 'Prize',
      count: 'Count',
      expectedOdds: 'Expected Odds',
      actualOdds: 'Actual Odds',
      under: 'Under',
      over: 'Over',
      normal: 'Normal',
      recentSales: 'Recent Sales',
      recentPayouts: 'Recent Payouts',
      noSalesYet: 'No sales yet',
      noPayoutsYet: 'No payouts yet',
      seller: 'Seller',
      paidBy: 'Paid By',
    },
    sales: {
      title: 'Sales',
      allSellers: 'All',
      totalRevenue: 'Total Revenue',
      totalSales: 'Total Sales',
      topSellers: 'Top Sellers',
      sales: 'sales',
      recentSales: 'Recent Sales',
      noSalesYet: 'No sales yet',
      code: 'Code',
      plays: 'Plays',
      price: 'Price',
      seller: 'Seller',
      date: 'Date',
    },
    payouts: {
      title: 'Payouts',
      registerPayout: 'Register Payout',
      pendingRequests: 'Pending Requests',
      totalPaidOut: 'Total Paid Out',
      requests: 'Requests',
      completedPayouts: 'Completed Payouts',
      registerPrizePayment: 'Register Prize Payment',
      code: 'Code',
      amount: 'Amount ($)',
      notesOptional: 'Notes (optional)',
      processing: 'Processing...',
      payoutRequests: 'Payout Requests',
      pending: 'Pending',
      approved: 'Approved',
      paid: 'Paid',
      rejected: 'Rejected',
      all: 'All',
      noRequests: 'No requests',
      approve: 'Approve',
      reject: 'Reject',
      markAsPaid: 'Mark as Paid',
      recentPayouts: 'Recent Payouts',
      player: 'Player',
      paidBy: 'Paid By',
      noPayoutsYet: 'No payouts registered yet',
      processed: 'Processed',
      by: 'by',
      alreadyPaid: 'This code was already paid on',
      payoutRegistered: 'Payout registered',
    },
    games: {
      title: 'Game Management',
      active: 'Active',
      disabled: 'Disabled',
      updated: 'Updated',
      gameStatusInfo: 'Game Status Info',
      whenDisabled: 'When a game is disabled:',
      cannotAccess: 'Players cannot access the game',
      existingSessions: 'Existing sessions are not affected',
      showMaintenance: 'Game will show as "Under Maintenance"',
      loading: 'Loading games...',
    },
    users: {
      title: 'User Management',
      addUser: 'Add User',
      newUser: 'New User',
      username: 'Username',
      password: 'Password',
      name: 'Name',
      role: 'Role',
      creating: 'Creating...',
      createUser: 'Create User',
      super: 'Super Admin',
      admin: 'Admin',
      seller: 'Seller',
      active: 'Active',
      inactive: 'Inactive',
      lastLogin: 'Last Login',
      never: 'Never',
      viewStats: 'View Stats',
      editUser: 'Edit User',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      newPassword: 'New Password',
      leaveBlank: 'Leave blank to keep current',
      stats: 'Stats',
      statsFor: 'Stats for',
      totalRevenue: 'Total Revenue',
      totalSales: 'Total Sales',
      loading: 'Loading...',
    },
    nav: {
      dashboard: 'Dashboard',
      users: 'Users',
      games: 'Games',
      rechargeCards: 'Recharge Cards',
      sales: 'Sales',
      payouts: 'Payouts',
      logout: 'Logout',
    },
    footer: {
      copyright: '© Gold Games',
    },
    gameMenu: {
      title: 'GOLD GAMES',
      subtitle: 'Choose Your Game',
      scratchTitle: 'SCRATCH & WIN',
      scratchDesc: 'Scratch and Win!',
      slotsTitle: 'SLOTS',
      slotsDesc: 'Spin and Win!',
      prizeText: 'Win up to $500',
    },
    gameUI: {
      backToMenu: 'Back to Menu',
      endSession: 'End Session',
      mute: 'Mute',
      unmute: 'Unmute',
      credit: 'Credit',
      bet: 'Bet',
      won: 'Won',
      spin: 'SPIN',
      code: 'CODE',
      enterCode: 'Enter Code',
      payTable: 'Pay Table',
      auto: 'AUTO',
      on: 'ON',
      off: 'OFF',
      claim: 'Claim',
      scratchAndWin: 'SCRATCH & WIN',
      winUpTo: 'Win Up To $500',
      threeMatchWin: '3 MATCHING WINS!',
      plays: 'Plays',
      winnings: 'Winnings',
      reveal: 'Reveal',
      next: 'Next',
      newCode: 'New Code',
      youWon: 'You Won',
      youLost: 'You Lost!',
      prize: 'Prize',
      viewPrizes: 'View Prizes',
    },
    navbar: {
      code: 'Code',
      credits: 'Credits',
      winnings: 'Winnings',
      endSession: 'End Session',
      confirmEndSession: 'Are you sure you want to end your session? You will lose any unclaimed winnings.',
      balance: 'Balance',
      noCredits: 'No credits',
      enterCode: 'Enter Code',
    },
    claimModal: {
      requestSent: 'REQUEST SENT!',
      amountRequested: 'Amount Requested',
      payoutInfo1: 'Your payment request has been sent.',
      payoutInfo2: 'We will contact you at the provided number.',
      codeRef: 'Code',
      creditsAdded: 'CREDITS ADDED!',
      creditsAddedAmount: 'Credits Added',
      creditsInfo1: 'Your winnings have been converted to credits.',
      creditsInfo2: 'Keep playing and good luck!',
      whatToDo: 'WHAT WOULD YOU LIKE TO DO?',
      totalWinnings: 'Total Winnings',
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      required: '*',
      namePlaceholder: 'Your full name',
      phonePlaceholder: 'Phone number',
      nameError: 'Please enter your full name',
      phoneError: 'Please enter a valid phone number',
      convertError: 'Error converting credits',
      requestError: 'Error sending request',
      connectionError: 'Connection error',
      completeInfo: 'Complete your information to continue.',
      sending: 'Sending...',
      processing: 'Processing...',
      requestPayout: 'Request Payout',
      convertToCredits: 'Convert to Credits',
      cancel: 'Cancel',
      letsPlay: 'Let\'s Play!',
      close: 'Close',
    },
  },
  es: {
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
    cardsAdmin: {
      title: 'Tarjetas de Recarga',
      generateCard: 'Generar Tarjeta',
      cardGenerated: 'Tarjeta Generada',
      generateRechargeCard: 'Generar Tarjeta de Recarga',
      amountLabel: 'Monto ($)',
      cancel: 'Cancelar',
      generating: 'Generando...',
      copyText: 'Copiar Texto',
      downloadImage: 'Descargar como Imagen',
      close: 'Cerrar',
      copyCode: 'Copiar Código',
      total: 'Total',
      unused: 'Sin Usar',
      used: 'Usadas',
      sold: 'Vendidas',
      totalValue: 'Valor Total',
      soldValue: 'Valor Vendido',
      status: 'Estado',
      created: 'Creada',
      usedAt: 'Usada',
      available: 'Disponible',
      loading: 'Cargando tarjetas...',
      markAsSold: 'Marcar como Vendida',
      actions: 'Acciones',
    },
    common: {
      backToDashboard: 'Volver al Panel',
      casinoAdmin: 'Admin Casino',
      welcome: 'Bienvenido',
      loading: 'Cargando...',
      error: 'Error',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      today: 'Hoy',
      thisMonth: 'Este Mes',
      date: 'Fecha',
      notes: 'Notas',
      login: 'Iniciar Sesión',
      loggingIn: 'Iniciando sesión...',
      username: 'Usuario',
      password: 'Contraseña',
      backToGames: 'Volver a Juegos',
    },
    dashboard: {
      title: 'Panel',
      totalRevenue: 'Ingresos Totales',
      totalSales: 'Ventas Totales',
      totalPayouts: 'Pagos Totales',
      netProfit: 'Ganancia Neta',
      positive: 'Positiva',
      negative: 'Negativa',
      rechargeCards: 'Tarjetas de Recarga',
      payoutRequests: 'Solicitudes de Pago',
      pending: 'Pendientes',
      paid: 'Pagadas',
      viewRequests: 'Ver Solicitudes',
      gameStatistics: 'Estadísticas de Juegos',
      totalPlays: 'Jugadas Totales',
      wins: 'Ganadas',
      losses: 'Perdidas',
      winRate: 'Tasa de Victoria',
      prizesPaid: 'Premios Pagados',
      prizeDistribution: 'Distribución de Premios (Real vs Esperado)',
      prize: 'Premio',
      count: 'Cantidad',
      expectedOdds: 'Probabilidad Esperada',
      actualOdds: 'Probabilidad Real',
      under: 'Bajo',
      over: 'Alto',
      normal: 'Normal',
      recentSales: 'Ventas Recientes',
      recentPayouts: 'Pagos Recientes',
      noSalesYet: 'Sin ventas aún',
      noPayoutsYet: 'Sin pagos aún',
      seller: 'Vendedor',
      paidBy: 'Pagado Por',
    },
    sales: {
      title: 'Ventas',
      allSellers: 'Todos',
      totalRevenue: 'Ingresos Totales',
      totalSales: 'Ventas Totales',
      topSellers: 'Mejores Vendedores',
      sales: 'ventas',
      recentSales: 'Ventas Recientes',
      noSalesYet: 'Sin ventas aún',
      code: 'Código',
      plays: 'Jugadas',
      price: 'Precio',
      seller: 'Vendedor',
      date: 'Fecha',
    },
    payouts: {
      title: 'Pagos',
      registerPayout: 'Registrar Pago',
      pendingRequests: 'Solicitudes Pendientes',
      totalPaidOut: 'Total Pagado',
      requests: 'Solicitudes',
      completedPayouts: 'Pagos Completados',
      registerPrizePayment: 'Registrar Pago de Premio',
      code: 'Código',
      amount: 'Monto ($)',
      notesOptional: 'Notas (opcional)',
      processing: 'Procesando...',
      payoutRequests: 'Solicitudes de Pago',
      pending: 'Pendiente',
      approved: 'Aprobado',
      paid: 'Pagado',
      rejected: 'Rechazado',
      all: 'Todos',
      noRequests: 'Sin solicitudes',
      approve: 'Aprobar',
      reject: 'Rechazar',
      markAsPaid: 'Marcar como Pagado',
      recentPayouts: 'Pagos Recientes',
      player: 'Jugador',
      paidBy: 'Pagado Por',
      noPayoutsYet: 'Sin pagos registrados aún',
      processed: 'Procesado',
      by: 'por',
      alreadyPaid: 'Este código ya fue pagado el',
      payoutRegistered: 'Pago registrado',
    },
    games: {
      title: 'Gestión de Juegos',
      active: 'Activo',
      disabled: 'Desactivado',
      updated: 'Actualizado',
      gameStatusInfo: 'Info de Estado del Juego',
      whenDisabled: 'Cuando un juego está desactivado:',
      cannotAccess: 'Los jugadores no pueden acceder al juego',
      existingSessions: 'Las sesiones existentes no se afectan',
      showMaintenance: 'El juego mostrará "En Mantenimiento"',
      loading: 'Cargando juegos...',
    },
    users: {
      title: 'Gestión de Usuarios',
      addUser: 'Agregar Usuario',
      newUser: 'Nuevo Usuario',
      username: 'Usuario',
      password: 'Contraseña',
      name: 'Nombre',
      role: 'Rol',
      creating: 'Creando...',
      createUser: 'Crear Usuario',
      super: 'Super Admin',
      admin: 'Admin',
      seller: 'Vendedor',
      active: 'Activo',
      inactive: 'Inactivo',
      lastLogin: 'Último Acceso',
      never: 'Nunca',
      viewStats: 'Ver Estadísticas',
      editUser: 'Editar Usuario',
      saveChanges: 'Guardar Cambios',
      saving: 'Guardando...',
      newPassword: 'Nueva Contraseña',
      leaveBlank: 'Dejar vacío para mantener actual',
      stats: 'Estadísticas',
      statsFor: 'Estadísticas de',
      totalRevenue: 'Ingresos Totales',
      totalSales: 'Ventas Totales',
      loading: 'Cargando...',
    },
    nav: {
      dashboard: 'Panel',
      users: 'Usuarios',
      games: 'Juegos',
      rechargeCards: 'Tarjetas de Recarga',
      sales: 'Ventas',
      payouts: 'Pagos',
      logout: 'Cerrar Sesión',
    },
    footer: {
      copyright: '© Gold Games',
    },
    gameMenu: {
      title: 'GOLD GAMES',
      subtitle: 'Elige Tu Juego',
      scratchTitle: 'RASCA Y GANA',
      scratchDesc: '¡Rasca y Gana!',
      slotsTitle: 'TRAGAMONEDAS',
      slotsDesc: '¡Gira y Gana!',
      prizeText: 'Gana hasta $500',
    },
    gameUI: {
      backToMenu: 'Volver al Menú',
      endSession: 'Terminar Sesión',
      mute: 'Silenciar',
      unmute: 'Activar Sonido',
      credit: 'Crédito',
      bet: 'Apuesta',
      won: 'Ganado',
      spin: 'GIRAR',
      code: 'CÓDIGO',
      enterCode: 'Ingresar Código',
      payTable: 'Tabla de Premios',
      auto: 'AUTO',
      on: 'SÍ',
      off: 'NO',
      claim: 'Cobrar',
      scratchAndWin: 'RASPA Y GANA',
      winUpTo: 'Gana Hasta $500',
      threeMatchWin: '¡3 IGUALES GANAN!',
      plays: 'Jugadas',
      winnings: 'Ganancias',
      reveal: 'Revelar',
      next: 'Siguiente',
      newCode: 'Nuevo Código',
      youWon: '¡Ganaste',
      youLost: '¡Has Perdido!',
      prize: 'Premio',
      viewPrizes: 'Ver Premios',
    },
    navbar: {
      code: 'Código',
      credits: 'Créditos',
      winnings: 'Ganancias',
      endSession: 'Terminar Sesión',
      confirmEndSession: '¿Estás seguro de terminar tu sesión? Perderás las ganancias no reclamadas.',
      balance: 'Saldo',
      noCredits: 'Sin créditos',
      enterCode: 'Ingresar Código',
    },
    claimModal: {
      requestSent: '¡SOLICITUD ENVIADA!',
      amountRequested: 'Monto Solicitado',
      payoutInfo1: 'Tu solicitud de pago ha sido enviada.',
      payoutInfo2: 'Te contactaremos al número proporcionado.',
      codeRef: 'Código',
      creditsAdded: '¡CRÉDITOS AGREGADOS!',
      creditsAddedAmount: 'Créditos Agregados',
      creditsInfo1: 'Tus ganancias se han convertido en créditos.',
      creditsInfo2: '¡Sigue jugando y buena suerte!',
      whatToDo: '¿QUÉ DESEAS HACER?',
      totalWinnings: 'Ganancias Totales',
      fullName: 'Nombre Completo',
      phoneNumber: 'Número de Teléfono',
      required: '*',
      namePlaceholder: 'Tu nombre completo',
      phonePlaceholder: 'Número de teléfono',
      nameError: 'Por favor ingresa tu nombre completo',
      phoneError: 'Por favor ingresa un número de teléfono válido',
      convertError: 'Error al convertir créditos',
      requestError: 'Error al enviar solicitud',
      connectionError: 'Error de conexión',
      completeInfo: 'Completa tus datos para continuar.',
      sending: 'Enviando...',
      processing: 'Procesando...',
      requestPayout: 'Solicitar Pago',
      convertToCredits: 'Convertir a Créditos',
      cancel: 'Cancelar',
      letsPlay: '¡A Jugar!',
      close: 'Cerrar',
    },
  },
  ar: {
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
    cardsAdmin: {
      title: 'بطاقات إعادة الشحن',
      generateCard: 'إنشاء بطاقة',
      cardGenerated: 'تم إنشاء البطاقة',
      generateRechargeCard: 'إنشاء بطاقة إعادة شحن',
      amountLabel: 'المبلغ ($)',
      cancel: 'إلغاء',
      generating: 'جاري الإنشاء...',
      copyText: 'نسخ النص',
      downloadImage: 'تحميل كصورة',
      close: 'إغلاق',
      copyCode: 'نسخ الرمز',
      total: 'الإجمالي',
      unused: 'غير مستخدمة',
      used: 'مستخدمة',
      sold: 'مباعة',
      totalValue: 'القيمة الإجمالية',
      soldValue: 'قيمة المبيعات',
      status: 'الحالة',
      created: 'تاريخ الإنشاء',
      usedAt: 'تاريخ الاستخدام',
      available: 'متاحة',
      loading: 'جاري تحميل البطاقات...',
      markAsSold: 'تسجيل كمباعة',
      actions: 'الإجراءات',
    },
    common: {
      backToDashboard: 'العودة للوحة التحكم',
      casinoAdmin: 'إدارة الكازينو',
      welcome: 'مرحباً',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      confirm: 'تأكيد',
      today: 'اليوم',
      thisMonth: 'هذا الشهر',
      date: 'التاريخ',
      notes: 'ملاحظات',
      login: 'تسجيل الدخول',
      loggingIn: 'جاري تسجيل الدخول...',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      backToGames: 'العودة للألعاب',
    },
    dashboard: {
      title: 'لوحة التحكم',
      totalRevenue: 'إجمالي الإيرادات',
      totalSales: 'إجمالي المبيعات',
      totalPayouts: 'إجمالي المدفوعات',
      netProfit: 'صافي الربح',
      positive: 'إيجابي',
      negative: 'سلبي',
      rechargeCards: 'بطاقات إعادة الشحن',
      payoutRequests: 'طلبات الدفع',
      pending: 'قيد الانتظار',
      paid: 'مدفوعة',
      viewRequests: 'عرض الطلبات',
      gameStatistics: 'إحصائيات الألعاب',
      totalPlays: 'إجمالي اللعبات',
      wins: 'الفوز',
      losses: 'الخسارة',
      winRate: 'معدل الفوز',
      prizesPaid: 'الجوائز المدفوعة',
      prizeDistribution: 'توزيع الجوائز (الفعلي مقابل المتوقع)',
      prize: 'الجائزة',
      count: 'العدد',
      expectedOdds: 'الاحتمال المتوقع',
      actualOdds: 'الاحتمال الفعلي',
      under: 'أقل',
      over: 'أكثر',
      normal: 'طبيعي',
      recentSales: 'المبيعات الأخيرة',
      recentPayouts: 'المدفوعات الأخيرة',
      noSalesYet: 'لا توجد مبيعات بعد',
      noPayoutsYet: 'لا توجد مدفوعات بعد',
      seller: 'البائع',
      paidBy: 'دفع بواسطة',
    },
    sales: {
      title: 'المبيعات',
      allSellers: 'الكل',
      totalRevenue: 'إجمالي الإيرادات',
      totalSales: 'إجمالي المبيعات',
      topSellers: 'أفضل البائعين',
      sales: 'مبيعات',
      recentSales: 'المبيعات الأخيرة',
      noSalesYet: 'لا توجد مبيعات بعد',
      code: 'الرمز',
      plays: 'اللعبات',
      price: 'السعر',
      seller: 'البائع',
      date: 'التاريخ',
    },
    payouts: {
      title: 'المدفوعات',
      registerPayout: 'تسجيل دفعة',
      pendingRequests: 'الطلبات المعلقة',
      totalPaidOut: 'إجمالي المدفوع',
      requests: 'الطلبات',
      completedPayouts: 'المدفوعات المكتملة',
      registerPrizePayment: 'تسجيل دفع جائزة',
      code: 'الرمز',
      amount: 'المبلغ ($)',
      notesOptional: 'ملاحظات (اختياري)',
      processing: 'جاري المعالجة...',
      payoutRequests: 'طلبات الدفع',
      pending: 'معلق',
      approved: 'موافق عليه',
      paid: 'مدفوع',
      rejected: 'مرفوض',
      all: 'الكل',
      noRequests: 'لا توجد طلبات',
      approve: 'موافقة',
      reject: 'رفض',
      markAsPaid: 'تحديد كمدفوع',
      recentPayouts: 'المدفوعات الأخيرة',
      player: 'اللاعب',
      paidBy: 'دفع بواسطة',
      noPayoutsYet: 'لا توجد مدفوعات مسجلة بعد',
      processed: 'تمت المعالجة',
      by: 'بواسطة',
      alreadyPaid: 'تم دفع هذا الرمز بالفعل في',
      payoutRegistered: 'تم تسجيل الدفعة',
    },
    games: {
      title: 'إدارة الألعاب',
      active: 'نشط',
      disabled: 'معطل',
      updated: 'تم التحديث',
      gameStatusInfo: 'معلومات حالة اللعبة',
      whenDisabled: 'عندما تكون اللعبة معطلة:',
      cannotAccess: 'لا يمكن للاعبين الوصول إلى اللعبة',
      existingSessions: 'الجلسات الحالية لا تتأثر',
      showMaintenance: 'ستظهر اللعبة "قيد الصيانة"',
      loading: 'جاري تحميل الألعاب...',
    },
    users: {
      title: 'إدارة المستخدمين',
      addUser: 'إضافة مستخدم',
      newUser: 'مستخدم جديد',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      name: 'الاسم',
      role: 'الدور',
      creating: 'جاري الإنشاء...',
      createUser: 'إنشاء مستخدم',
      super: 'مدير أعلى',
      admin: 'مدير',
      seller: 'بائع',
      active: 'نشط',
      inactive: 'غير نشط',
      lastLogin: 'آخر دخول',
      never: 'أبداً',
      viewStats: 'عرض الإحصائيات',
      editUser: 'تعديل المستخدم',
      saveChanges: 'حفظ التغييرات',
      saving: 'جاري الحفظ...',
      newPassword: 'كلمة مرور جديدة',
      leaveBlank: 'اتركه فارغاً للإبقاء على الحالي',
      stats: 'الإحصائيات',
      statsFor: 'إحصائيات',
      totalRevenue: 'إجمالي الإيرادات',
      totalSales: 'إجمالي المبيعات',
      loading: 'جاري التحميل...',
    },
    nav: {
      dashboard: 'لوحة التحكم',
      users: 'المستخدمين',
      games: 'الألعاب',
      rechargeCards: 'بطاقات الشحن',
      sales: 'المبيعات',
      payouts: 'المدفوعات',
      logout: 'تسجيل الخروج',
    },
    footer: {
      copyright: '© Gold Games',
    },
    gameMenu: {
      title: 'GOLD GAMES',
      subtitle: 'اختر لعبتك',
      scratchTitle: 'اخدش واربح',
      scratchDesc: 'اخدش واربح!',
      slotsTitle: 'سلوتس',
      slotsDesc: 'دوّر واربح!',
      prizeText: 'اربح حتى $500',
    },
    gameUI: {
      backToMenu: 'العودة للقائمة',
      endSession: 'إنهاء الجلسة',
      mute: 'كتم الصوت',
      unmute: 'تفعيل الصوت',
      credit: 'الرصيد',
      bet: 'الرهان',
      won: 'ربحت',
      spin: 'دوران',
      code: 'الرمز',
      enterCode: 'أدخل الرمز',
      payTable: 'جدول الجوائز',
      auto: 'تلقائي',
      on: 'تشغيل',
      off: 'إيقاف',
      claim: 'صرف',
      scratchAndWin: 'اخدش واربح',
      winUpTo: 'اربح حتى $500',
      threeMatchWin: '3 متطابقات تفوز!',
      plays: 'اللعبات',
      winnings: 'الأرباح',
      reveal: 'كشف',
      next: 'التالي',
      newCode: 'رمز جديد',
      youWon: 'ربحت',
      youLost: 'خسرت!',
      prize: 'الجائزة',
      viewPrizes: 'عرض الجوائز',
    },
    navbar: {
      code: 'الرمز',
      credits: 'الرصيد',
      winnings: 'الأرباح',
      endSession: 'إنهاء الجلسة',
      confirmEndSession: 'هل أنت متأكد من إنهاء جلستك؟ ستفقد أي أرباح لم يتم صرفها.',
      balance: 'الرصيد',
      noCredits: 'لا يوجد رصيد',
      enterCode: 'أدخل الرمز',
    },
    claimModal: {
      requestSent: 'تم إرسال الطلب!',
      amountRequested: 'المبلغ المطلوب',
      payoutInfo1: 'تم إرسال طلب الدفع الخاص بك.',
      payoutInfo2: 'سنتواصل معك على الرقم المقدم.',
      codeRef: 'الرمز',
      creditsAdded: 'تمت إضافة الرصيد!',
      creditsAddedAmount: 'الرصيد المضاف',
      creditsInfo1: 'تم تحويل أرباحك إلى رصيد.',
      creditsInfo2: 'استمر في اللعب وحظاً موفقاً!',
      whatToDo: 'ماذا تريد أن تفعل؟',
      totalWinnings: 'إجمالي الأرباح',
      fullName: 'الاسم الكامل',
      phoneNumber: 'رقم الهاتف',
      required: '*',
      namePlaceholder: 'اسمك الكامل',
      phonePlaceholder: 'رقم الهاتف',
      nameError: 'الرجاء إدخال اسمك الكامل',
      phoneError: 'الرجاء إدخال رقم هاتف صحيح',
      convertError: 'خطأ في تحويل الرصيد',
      requestError: 'خطأ في إرسال الطلب',
      connectionError: 'خطأ في الاتصال',
      completeInfo: 'أكمل بياناتك للمتابعة.',
      sending: 'جاري الإرسال...',
      processing: 'جاري المعالجة...',
      requestPayout: 'طلب الدفع',
      convertToCredits: 'تحويل إلى رصيد',
      cancel: 'إلغاء',
      letsPlay: 'هيا نلعب!',
      close: 'إغلاق',
    },
  },
};
