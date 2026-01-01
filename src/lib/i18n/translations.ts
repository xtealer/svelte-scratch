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
  backToHome: string;
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
  ourGames: string;
  allBets: string;
  game: string;
  user: string;
  time: string;
  betAmount: string;
  multiplier: string;
  payout: string;
  playNow: string;
  noBetsYet: string;
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
  login: string;
  register: string;
  deposit: string;
  withdraw: string;
  logout: string;
  confirmLogout: string;
}

export interface AuthModalTranslations {
  registerTitle: string;
  loginTitle: string;
  email: string;
  emailPlaceholder: string;
  fullName: string;
  namePlaceholder: string;
  country: string;
  language: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  register: string;
  registering: string;
  login: string;
  loggingIn: string;
  cancel: string;
  back: string;
  emailError: string;
  nameError: string;
  passwordError: string;
  passwordMismatch: string;
  registerError: string;
  loginError: string;
  connectionError: string;
  fillAllFields: string;
  registerSuccess: string;
  welcomeMessage: string;
  haveAccount: string;
  loginHere: string;
  noAccount: string;
  registerHere: string;
  loginWithMetamask: string;
  loginWithEmail: string;
  or: string;
  metamaskNotFound: string;
  metamaskError: string;
  installMetamask: string;
  linkWallet: string;
  linkWalletInfo: string;
  linkError: string;
  linking: string;
  linkAndLogin: string;
  skipLinking: string;
}

export interface DepositModalTranslations {
  title: string;
  currentBalance: string;
  rechargeCard: string;
  rechargeDesc: string;
  depositCrypto: string;
  cryptoDesc: string;
  cancel: string;
  invalidCode: string;
  sendTo: string;
  cryptoInfo1: string;
  cryptoInfo2: string;
}

export interface WithdrawModalTranslations {
  title: string;
  availableBalance: string;
  amount: string;
  // Method selection
  cryptoTitle: string;
  cryptoDesc: string;
  cashTitle: string;
  cashDesc: string;
  // Crypto fields
  selectNetwork: string;
  walletAddress: string;
  addressPlaceholder: string;
  cryptoInfo1: string;
  cryptoInfo2: string;
  // Cash fields
  fullName: string;
  namePlaceholder: string;
  phoneNumber: string;
  phonePlaceholder: string;
  cashInfo1: string;
  cashInfo2: string;
  // Errors
  amountError: string;
  insufficientBalance: string;
  addressError: string;
  invalidAddress: string;
  nameError: string;
  phoneError: string;
  requestError: string;
  // Actions
  processing: string;
  submit: string;
  cancel: string;
  back: string;
  // Success
  requestSent: string;
  amountRequested: string;
  cryptoSuccessInfo1: string;
  cryptoSuccessInfo2: string;
  cashSuccessInfo1: string;
  cashSuccessInfo2: string;
  close: string;
  // 2FA Verification
  verificationTitle: string;
  verificationInstruction: string;
  verificationPlaceholder: string;
  verify: string;
  verifying: string;
  resendCode: string;
  sending: string;
  codeSent: string;
  codeExpires: string;
  invalidCode: string;
  codeError: string;
}

export interface CodeModalTranslations {
  title: string;
  placeholder: string;
  enterCodeError: string;
  info1: string;
  loadPlays: string;
  loading: string;
  cancel: string;
  // Session warning translations
  activeSessionTitle: string;
  activeSessionWarning: string;
  currentCode: string;
  creditsLeft: string;
  unclaimedWinnings: string;
  loseBalanceWarning: string;
  continueAnyway: string;
  keepSession: string;
}

export interface PrizeModalTranslations {
  title: string;
  odds: string;
  close: string;
}

export interface ProfileTranslations {
  title: string;
  wallet: string;
  linkEmailTitle: string;
  linkEmailInfo: string;
  linkEmail: string;
  emailLinkedSuccess: string;
  accountInfo: string;
  editProfile: string;
  preferredLanguage: string;
  languageSaved: string;
  savingLanguage: string;
}

export interface TwoFactorTranslations {
  title: string;
  instruction: string;
  enterCode: string;
  invalidCode: string;
  verify: string;
  verifying: string;
  resendCode: string;
  sending: string;
  codeSent: string;
  resendError: string;
  expiresNote: string;
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
  codeModal: CodeModalTranslations;
  prizeModal: PrizeModalTranslations;
  authModal: AuthModalTranslations;
  depositModal: DepositModalTranslations;
  withdrawModal: WithdrawModalTranslations;
  profile: ProfileTranslations;
  twoFactor: TwoFactorTranslations;
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
      backToHome: 'Back to Home',
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
      scratchTitle: 'Scratch',
      scratchDesc: 'Scratch and Win!',
      slotsTitle: 'Slots',
      slotsDesc: 'Spin and Win!',
      prizeText: 'Win up to $500',
      ourGames: 'Our Games',
      allBets: 'All Bets',
      game: 'Game',
      user: 'User',
      time: 'Time',
      betAmount: 'Bet',
      multiplier: 'Multiplier',
      payout: 'Payout',
      playNow: 'Play Now',
      noBetsYet: 'No bets yet',
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
      login: 'Login',
      register: 'Register',
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      logout: 'Logout',
      confirmLogout: 'Are you sure you want to logout?',
    },
    codeModal: {
      title: 'ENTER CODE',
      placeholder: 'Enter code (e.g.: ABC123)',
      enterCodeError: 'Please enter a code',
      info1: 'Enter your code to claim your recharge.',
      loadPlays: 'Claim',
      loading: 'Loading...',
      cancel: 'Cancel',
      activeSessionTitle: 'ACTIVE SESSION',
      activeSessionWarning: 'You already have an active session with remaining balance.',
      currentCode: 'Current Code',
      creditsLeft: 'Credits Left',
      unclaimedWinnings: 'Unclaimed Winnings',
      loseBalanceWarning: 'Loading a new code will replace your current session and you will lose any remaining balance!',
      continueAnyway: 'Continue Anyway',
      keepSession: 'Keep Current Session',
    },
    prizeModal: {
      title: 'PRIZE LIST',
      odds: '1 in',
      close: 'Close',
    },
    authModal: {
      registerTitle: 'CREATE ACCOUNT',
      loginTitle: 'LOGIN',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      fullName: 'Full Name',
      namePlaceholder: 'Your full name',
      country: 'Country',
      language: 'Preferred Language',
      password: 'Password',
      passwordPlaceholder: 'Enter password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm password',
      register: 'Create Account',
      registering: 'Creating...',
      login: 'Login',
      loggingIn: 'Logging in...',
      cancel: 'Cancel',
      back: 'Back',
      emailError: 'Please enter a valid email',
      nameError: 'Please enter your full name',
      passwordError: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      registerError: 'Error creating account',
      loginError: 'Invalid email or password',
      connectionError: 'Connection error',
      fillAllFields: 'Please fill all fields',
      registerSuccess: 'ACCOUNT CREATED!',
      welcomeMessage: 'Welcome! Your account has been created successfully.',
      haveAccount: 'Already have an account?',
      loginHere: 'Login here',
      noAccount: "Don't have an account?",
      registerHere: 'Register here',
      loginWithMetamask: 'Login with Metamask',
      loginWithEmail: 'Login with Email',
      or: 'or',
      metamaskNotFound: 'Metamask not found',
      metamaskError: 'Error connecting to Metamask',
      installMetamask: 'Install Metamask to use this feature',
      linkWallet: 'LINK WALLET',
      linkWalletInfo: 'This wallet is not linked to any account. Login to your existing account to link it.',
      linkError: 'Error linking wallet',
      linking: 'Linking...',
      linkAndLogin: 'Link & Login',
      skipLinking: 'Continue without linking',
    },
    depositModal: {
      title: 'DEPOSIT',
      currentBalance: 'Current Balance',
      rechargeCard: 'Recharge Card',
      rechargeDesc: 'Use a recharge card code',
      depositCrypto: 'Deposit Crypto',
      cryptoDesc: 'Send BTC, ETH or USDT',
      cancel: 'Cancel',
      invalidCode: 'Invalid code',
      sendTo: 'Send to this address:',
      cryptoInfo1: 'Your balance will be updated after network confirmation.',
      cryptoInfo2: 'Only send the selected cryptocurrency to this address.',
    },
    withdrawModal: {
      title: 'WITHDRAW',
      availableBalance: 'Available Balance',
      amount: 'Amount',
      cryptoTitle: 'Withdraw USDT',
      cryptoDesc: 'Send to your wallet address',
      cashTitle: 'Cash Withdrawal',
      cashDesc: 'Request handled by partner',
      selectNetwork: 'Select Network',
      walletAddress: 'Wallet Address',
      addressPlaceholder: '0x...',
      cryptoInfo1: 'Withdrawals are processed within 24 hours.',
      cryptoInfo2: 'Only send to the selected network!',
      fullName: 'Full Name',
      namePlaceholder: 'Your full name',
      phoneNumber: 'Phone Number',
      phonePlaceholder: 'Phone number',
      cashInfo1: 'Our partner will contact you to arrange payment.',
      cashInfo2: 'Please ensure your contact information is correct.',
      amountError: 'Please enter a valid amount',
      insufficientBalance: 'Insufficient balance',
      addressError: 'Please enter a wallet address',
      invalidAddress: 'Please enter a valid wallet address',
      nameError: 'Please enter your full name',
      phoneError: 'Please enter a valid phone number',
      requestError: 'Error processing withdrawal request',
      processing: 'Processing...',
      submit: 'Request Withdrawal',
      cancel: 'Cancel',
      back: 'Back',
      requestSent: 'REQUEST SENT!',
      amountRequested: 'Amount Requested',
      cryptoSuccessInfo1: 'Your withdrawal request has been submitted.',
      cryptoSuccessInfo2: 'You will receive your USDT within 24 hours.',
      cashSuccessInfo1: 'Your cash withdrawal request has been submitted.',
      cashSuccessInfo2: 'Our partner will contact you shortly.',
      close: 'Close',
      verificationTitle: 'VERIFY WITHDRAWAL',
      verificationInstruction: 'Enter the 6-digit code sent to your email',
      verificationPlaceholder: 'Enter code',
      verify: 'Verify & Submit',
      verifying: 'Verifying...',
      resendCode: 'Resend Code',
      sending: 'Sending...',
      codeSent: 'New code sent!',
      codeExpires: 'Code expires in 5 minutes',
      invalidCode: 'Invalid verification code',
      codeError: 'Failed to send verification code',
    },
    profile: {
      title: 'PROFILE',
      wallet: 'Wallet',
      linkEmailTitle: 'Link Email & Password',
      linkEmailInfo: 'Add an email and password to your account for additional login options.',
      linkEmail: 'Link Email',
      emailLinkedSuccess: 'Email linked successfully!',
      accountInfo: 'Account Information',
      editProfile: 'Edit Profile',
      preferredLanguage: 'Preferred Language',
      languageSaved: 'Language saved!',
      savingLanguage: 'Saving...',
    },
    twoFactor: {
      title: 'VERIFICATION CODE',
      instruction: 'Enter the 6-digit code sent to your email',
      enterCode: 'Please enter the verification code',
      invalidCode: 'Invalid verification code',
      verify: 'Verify',
      verifying: 'Verifying...',
      resendCode: 'Resend Code',
      sending: 'Sending...',
      codeSent: 'New code sent!',
      resendError: 'Failed to resend code',
      expiresNote: 'Code expires in 5 minutes',
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
      backToHome: 'Volver al Inicio',
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
      scratchTitle: 'Rasca',
      scratchDesc: '¡Rasca y Gana!',
      slotsTitle: 'Tragamonedas',
      slotsDesc: '¡Gira y Gana!',
      prizeText: 'Gana hasta $500',
      ourGames: 'Nuestros Juegos',
      allBets: 'Todas las Apuestas',
      game: 'Juego',
      user: 'Usuario',
      time: 'Hora',
      betAmount: 'Apuesta',
      multiplier: 'Multiplicador',
      payout: 'Premio',
      playNow: 'Jugar Ahora',
      noBetsYet: 'Sin apuestas aún',
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
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      deposit: 'Depositar',
      withdraw: 'Retirar',
      logout: 'Cerrar Sesión',
      confirmLogout: '¿Estás seguro de cerrar sesión?',
    },
    codeModal: {
      title: 'INGRESAR CÓDIGO',
      placeholder: 'Ingresa código (ej: ABC123)',
      enterCodeError: 'Por favor ingresa un código',
      info1: 'Ingresa el código de tu boleto para cargar tus jugadas.',
      loadPlays: 'Reclamar',
      loading: 'Cargando...',
      cancel: 'Cancelar',
      activeSessionTitle: 'SESIÓN ACTIVA',
      activeSessionWarning: 'Ya tienes una sesión activa con saldo restante.',
      currentCode: 'Código Actual',
      creditsLeft: 'Créditos Restantes',
      unclaimedWinnings: 'Ganancias Sin Reclamar',
      loseBalanceWarning: '¡Cargar un nuevo código reemplazará tu sesión actual y perderás cualquier saldo restante!',
      continueAnyway: 'Continuar de Todos Modos',
      keepSession: 'Mantener Sesión Actual',
    },
    prizeModal: {
      title: 'LISTA DE PREMIOS',
      odds: '1 en',
      close: 'Cerrar',
    },
    authModal: {
      registerTitle: 'CREAR CUENTA',
      loginTitle: 'INICIAR SESIÓN',
      email: 'Correo Electrónico',
      emailPlaceholder: 'tu@correo.com',
      fullName: 'Nombre Completo',
      namePlaceholder: 'Tu nombre completo',
      country: 'País',
      language: 'Idioma Preferido',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingresa contraseña',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Confirma contraseña',
      register: 'Crear Cuenta',
      registering: 'Creando...',
      login: 'Iniciar Sesión',
      loggingIn: 'Iniciando sesión...',
      cancel: 'Cancelar',
      back: 'Volver',
      emailError: 'Por favor ingresa un correo válido',
      nameError: 'Por favor ingresa tu nombre completo',
      passwordError: 'La contraseña debe tener al menos 6 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      registerError: 'Error al crear cuenta',
      loginError: 'Correo o contraseña inválidos',
      connectionError: 'Error de conexión',
      fillAllFields: 'Por favor completa todos los campos',
      registerSuccess: '¡CUENTA CREADA!',
      welcomeMessage: '¡Bienvenido! Tu cuenta ha sido creada exitosamente.',
      haveAccount: '¿Ya tienes una cuenta?',
      loginHere: 'Inicia sesión aquí',
      noAccount: '¿No tienes una cuenta?',
      registerHere: 'Regístrate aquí',
      loginWithMetamask: 'Iniciar con Metamask',
      loginWithEmail: 'Iniciar con Correo',
      or: 'o',
      metamaskNotFound: 'Metamask no encontrado',
      metamaskError: 'Error al conectar con Metamask',
      installMetamask: 'Instala Metamask para usar esta función',
      linkWallet: 'VINCULAR BILLETERA',
      linkWalletInfo: 'Esta billetera no está vinculada a ninguna cuenta. Inicia sesión en tu cuenta existente para vincularla.',
      linkError: 'Error al vincular billetera',
      linking: 'Vinculando...',
      linkAndLogin: 'Vincular e Iniciar',
      skipLinking: 'Continuar sin vincular',
    },
    depositModal: {
      title: 'DEPOSITAR',
      currentBalance: 'Saldo Actual',
      rechargeCard: 'Tarjeta de Recarga',
      rechargeDesc: 'Usa un código de tarjeta de recarga',
      depositCrypto: 'Depositar Cripto',
      cryptoDesc: 'Envía BTC, ETH o USDT',
      cancel: 'Cancelar',
      invalidCode: 'Código inválido',
      sendTo: 'Enviar a esta dirección:',
      cryptoInfo1: 'Tu saldo se actualizará después de la confirmación de la red.',
      cryptoInfo2: 'Solo envía la criptomoneda seleccionada a esta dirección.',
    },
    withdrawModal: {
      title: 'RETIRAR',
      availableBalance: 'Saldo Disponible',
      amount: 'Monto',
      cryptoTitle: 'Retirar USDT',
      cryptoDesc: 'Enviar a tu billetera',
      cashTitle: 'Retiro en Efectivo',
      cashDesc: 'Solicitud manejada por socio',
      selectNetwork: 'Seleccionar Red',
      walletAddress: 'Dirección de Billetera',
      addressPlaceholder: '0x...',
      cryptoInfo1: 'Los retiros se procesan en 24 horas.',
      cryptoInfo2: '¡Solo envía a la red seleccionada!',
      fullName: 'Nombre Completo',
      namePlaceholder: 'Tu nombre completo',
      phoneNumber: 'Número de Teléfono',
      phonePlaceholder: 'Número de teléfono',
      cashInfo1: 'Nuestro socio te contactará para coordinar el pago.',
      cashInfo2: 'Por favor asegúrate de que tu información de contacto sea correcta.',
      amountError: 'Por favor ingresa un monto válido',
      insufficientBalance: 'Saldo insuficiente',
      addressError: 'Por favor ingresa una dirección de billetera',
      invalidAddress: 'Por favor ingresa una dirección de billetera válida',
      nameError: 'Por favor ingresa tu nombre completo',
      phoneError: 'Por favor ingresa un número de teléfono válido',
      requestError: 'Error al procesar la solicitud de retiro',
      processing: 'Procesando...',
      submit: 'Solicitar Retiro',
      cancel: 'Cancelar',
      back: 'Volver',
      requestSent: '¡SOLICITUD ENVIADA!',
      amountRequested: 'Monto Solicitado',
      cryptoSuccessInfo1: 'Tu solicitud de retiro ha sido enviada.',
      cryptoSuccessInfo2: 'Recibirás tu USDT en 24 horas.',
      cashSuccessInfo1: 'Tu solicitud de retiro en efectivo ha sido enviada.',
      cashSuccessInfo2: 'Nuestro socio te contactará pronto.',
      close: 'Cerrar',
      verificationTitle: 'VERIFICAR RETIRO',
      verificationInstruction: 'Ingresa el código de 6 dígitos enviado a tu correo',
      verificationPlaceholder: 'Ingresa código',
      verify: 'Verificar y Enviar',
      verifying: 'Verificando...',
      resendCode: 'Reenviar Código',
      sending: 'Enviando...',
      codeSent: '¡Nuevo código enviado!',
      codeExpires: 'El código expira en 5 minutos',
      invalidCode: 'Código de verificación inválido',
      codeError: 'Error al enviar código de verificación',
    },
    profile: {
      title: 'PERFIL',
      wallet: 'Billetera',
      linkEmailTitle: 'Vincular Correo y Contraseña',
      linkEmailInfo: 'Agrega un correo y contraseña a tu cuenta para opciones adicionales de inicio de sesión.',
      linkEmail: 'Vincular Correo',
      emailLinkedSuccess: '¡Correo vinculado exitosamente!',
      accountInfo: 'Información de la Cuenta',
      editProfile: 'Editar Perfil',
      preferredLanguage: 'Idioma Preferido',
      languageSaved: '¡Idioma guardado!',
      savingLanguage: 'Guardando...',
    },
    twoFactor: {
      title: 'CÓDIGO DE VERIFICACIÓN',
      instruction: 'Ingresa el código de 6 dígitos enviado a tu correo',
      enterCode: 'Por favor ingresa el código de verificación',
      invalidCode: 'Código de verificación inválido',
      verify: 'Verificar',
      verifying: 'Verificando...',
      resendCode: 'Reenviar Código',
      sending: 'Enviando...',
      codeSent: '¡Nuevo código enviado!',
      resendError: 'Error al reenviar código',
      expiresNote: 'El código expira en 5 minutos',
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
      backToHome: 'العودة للرئيسية',
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
      scratchTitle: 'اخدش',
      scratchDesc: 'اخدش واربح!',
      slotsTitle: 'سلوتس',
      slotsDesc: 'دوّر واربح!',
      prizeText: 'اربح حتى $500',
      ourGames: 'ألعابنا',
      allBets: 'جميع الرهانات',
      game: 'اللعبة',
      user: 'المستخدم',
      time: 'الوقت',
      betAmount: 'الرهان',
      multiplier: 'المضاعف',
      payout: 'الجائزة',
      playNow: 'العب الآن',
      noBetsYet: 'لا توجد رهانات بعد',
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
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      deposit: 'إيداع',
      withdraw: 'سحب',
      logout: 'تسجيل الخروج',
      confirmLogout: 'هل أنت متأكد من تسجيل الخروج؟',
    },
    codeModal: {
      title: 'أدخل الرمز',
      placeholder: 'أدخل الرمز (مثال: ABC123)',
      enterCodeError: 'الرجاء إدخال رمز',
      info1: 'أدخل رمز تذكرتك لتحميل لعباتك.',
      loadPlays: 'مطالبة',
      loading: 'جاري التحميل...',
      cancel: 'إلغاء',
      activeSessionTitle: 'جلسة نشطة',
      activeSessionWarning: 'لديك بالفعل جلسة نشطة برصيد متبقي.',
      currentCode: 'الرمز الحالي',
      creditsLeft: 'الرصيد المتبقي',
      unclaimedWinnings: 'أرباح غير مصروفة',
      loseBalanceWarning: 'تحميل رمز جديد سيستبدل جلستك الحالية وستفقد أي رصيد متبقي!',
      continueAnyway: 'المتابعة على أي حال',
      keepSession: 'الاحتفاظ بالجلسة الحالية',
    },
    prizeModal: {
      title: 'قائمة الجوائز',
      odds: '1 من',
      close: 'إغلاق',
    },
    authModal: {
      registerTitle: 'إنشاء حساب',
      loginTitle: 'تسجيل الدخول',
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'بريدك@الإلكتروني.com',
      fullName: 'الاسم الكامل',
      namePlaceholder: 'اسمك الكامل',
      country: 'الدولة',
      language: 'اللغة المفضلة',
      password: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      register: 'إنشاء حساب',
      registering: 'جاري الإنشاء...',
      login: 'تسجيل الدخول',
      loggingIn: 'جاري تسجيل الدخول...',
      cancel: 'إلغاء',
      back: 'رجوع',
      emailError: 'الرجاء إدخال بريد إلكتروني صحيح',
      nameError: 'الرجاء إدخال اسمك الكامل',
      passwordError: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      registerError: 'خطأ في إنشاء الحساب',
      loginError: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      connectionError: 'خطأ في الاتصال',
      fillAllFields: 'الرجاء ملء جميع الحقول',
      registerSuccess: 'تم إنشاء الحساب!',
      welcomeMessage: 'مرحباً! تم إنشاء حسابك بنجاح.',
      haveAccount: 'لديك حساب بالفعل؟',
      loginHere: 'سجل دخولك هنا',
      noAccount: 'ليس لديك حساب؟',
      registerHere: 'سجل هنا',
      loginWithMetamask: 'الدخول بـ Metamask',
      loginWithEmail: 'الدخول بالبريد الإلكتروني',
      or: 'أو',
      metamaskNotFound: 'Metamask غير موجود',
      metamaskError: 'خطأ في الاتصال بـ Metamask',
      installMetamask: 'قم بتثبيت Metamask لاستخدام هذه الميزة',
      linkWallet: 'ربط المحفظة',
      linkWalletInfo: 'هذه المحفظة غير مرتبطة بأي حساب. سجل دخولك إلى حسابك الحالي لربطها.',
      linkError: 'خطأ في ربط المحفظة',
      linking: 'جاري الربط...',
      linkAndLogin: 'ربط وتسجيل الدخول',
      skipLinking: 'متابعة بدون ربط',
    },
    depositModal: {
      title: 'إيداع',
      currentBalance: 'الرصيد الحالي',
      rechargeCard: 'بطاقة إعادة الشحن',
      rechargeDesc: 'استخدم رمز بطاقة إعادة الشحن',
      depositCrypto: 'إيداع العملات المشفرة',
      cryptoDesc: 'أرسل BTC أو ETH أو USDT',
      cancel: 'إلغاء',
      invalidCode: 'رمز غير صالح',
      sendTo: 'أرسل إلى هذا العنوان:',
      cryptoInfo1: 'سيتم تحديث رصيدك بعد تأكيد الشبكة.',
      cryptoInfo2: 'أرسل فقط العملة المشفرة المحددة إلى هذا العنوان.',
    },
    withdrawModal: {
      title: 'سحب',
      availableBalance: 'الرصيد المتاح',
      amount: 'المبلغ',
      cryptoTitle: 'سحب USDT',
      cryptoDesc: 'إرسال إلى عنوان محفظتك',
      cashTitle: 'سحب نقدي',
      cashDesc: 'طلب يتم التعامل معه من قبل الشريك',
      selectNetwork: 'اختر الشبكة',
      walletAddress: 'عنوان المحفظة',
      addressPlaceholder: '0x...',
      cryptoInfo1: 'تتم معالجة عمليات السحب خلال 24 ساعة.',
      cryptoInfo2: 'أرسل فقط إلى الشبكة المحددة!',
      fullName: 'الاسم الكامل',
      namePlaceholder: 'اسمك الكامل',
      phoneNumber: 'رقم الهاتف',
      phonePlaceholder: 'رقم الهاتف',
      cashInfo1: 'سيتصل بك شريكنا لترتيب الدفع.',
      cashInfo2: 'يرجى التأكد من صحة معلومات الاتصال الخاصة بك.',
      amountError: 'الرجاء إدخال مبلغ صالح',
      insufficientBalance: 'رصيد غير كافي',
      addressError: 'الرجاء إدخال عنوان المحفظة',
      invalidAddress: 'الرجاء إدخال عنوان محفظة صالح',
      nameError: 'الرجاء إدخال اسمك الكامل',
      phoneError: 'الرجاء إدخال رقم هاتف صالح',
      requestError: 'خطأ في معالجة طلب السحب',
      processing: 'جاري المعالجة...',
      submit: 'طلب السحب',
      cancel: 'إلغاء',
      back: 'رجوع',
      requestSent: 'تم إرسال الطلب!',
      amountRequested: 'المبلغ المطلوب',
      cryptoSuccessInfo1: 'تم تقديم طلب السحب الخاص بك.',
      cryptoSuccessInfo2: 'ستتلقى USDT الخاص بك في غضون 24 ساعة.',
      cashSuccessInfo1: 'تم تقديم طلب السحب النقدي الخاص بك.',
      cashSuccessInfo2: 'سيتصل بك شريكنا قريباً.',
      close: 'إغلاق',
      verificationTitle: 'تحقق من السحب',
      verificationInstruction: 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني',
      verificationPlaceholder: 'أدخل الرمز',
      verify: 'تحقق وأرسل',
      verifying: 'جاري التحقق...',
      resendCode: 'إعادة إرسال الرمز',
      sending: 'جاري الإرسال...',
      codeSent: 'تم إرسال رمز جديد!',
      codeExpires: 'الرمز صالح لمدة 5 دقائق',
      invalidCode: 'رمز التحقق غير صالح',
      codeError: 'فشل في إرسال رمز التحقق',
    },
    profile: {
      title: 'الملف الشخصي',
      wallet: 'المحفظة',
      linkEmailTitle: 'ربط البريد الإلكتروني وكلمة المرور',
      linkEmailInfo: 'أضف بريدًا إلكترونيًا وكلمة مرور إلى حسابك للحصول على خيارات تسجيل دخول إضافية.',
      linkEmail: 'ربط البريد الإلكتروني',
      emailLinkedSuccess: 'تم ربط البريد الإلكتروني بنجاح!',
      accountInfo: 'معلومات الحساب',
      editProfile: 'تعديل الملف الشخصي',
      preferredLanguage: 'اللغة المفضلة',
      languageSaved: 'تم حفظ اللغة!',
      savingLanguage: 'جاري الحفظ...',
    },
    twoFactor: {
      title: 'رمز التحقق',
      instruction: 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني',
      enterCode: 'الرجاء إدخال رمز التحقق',
      invalidCode: 'رمز التحقق غير صالح',
      verify: 'تحقق',
      verifying: 'جاري التحقق...',
      resendCode: 'إعادة إرسال الرمز',
      sending: 'جاري الإرسال...',
      codeSent: 'تم إرسال رمز جديد!',
      resendError: 'فشل في إعادة إرسال الرمز',
      expiresNote: 'الرمز صالح لمدة 5 دقائق',
    },
  },
};
