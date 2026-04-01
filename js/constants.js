// ── CONSTANTS ──────────────────────────────────────────────────────────────
const SK='finanza_v1';
const CLIENT_ID='472780980276-j7tadqv8v4f33thsnpkfhlggmrssmoee.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
const SCHEMA_VERSION=10;
const DRIVE_FILENAME='finanza_backup.json';
const DEF_EXP_CATS=[
  {id:'ce1',name:'Cibo',emoji:'🍔',custom:false},{id:'ce2',name:'Ristorante',emoji:'🍽️',custom:false},
  {id:'ce3',name:'Trasporti',emoji:'🚗',custom:false},{id:'ce4',name:'Casa',emoji:'🏠',custom:false},
  {id:'ce5',name:'Salute',emoji:'💊',custom:false},{id:'ce6',name:'Shopping',emoji:'🛍️',custom:false},
  {id:'ce7',name:'Intrattenimento',emoji:'🎬',custom:false},{id:'ce8',name:'Sport',emoji:'⚽',custom:false},
  {id:'ce9',name:'Istruzione',emoji:'📚',custom:false},{id:'ce10',name:'Viaggi',emoji:'✈️',custom:false},
  {id:'ce11',name:'Tecnologia',emoji:'💻',custom:false},{id:'ce12',name:'Utenze',emoji:'💡',custom:false},
  {id:'ce13',name:'Abbigliamento',emoji:'👗',custom:false},{id:'ce14',name:'Assicurazioni',emoji:'🛡️',custom:false},
  {id:'ce15',name:'Animali',emoji:'🐾',custom:false},{id:'ce16',name:'Regali',emoji:'🎁',custom:false},
  {id:'ce17',name:'Bellezza',emoji:'💄',custom:false},{id:'ce18',name:'Altro',emoji:'📦',custom:false},
];
const DEF_INC_CATS=[
  {id:'ci1',name:'Stipendio',emoji:'💼',custom:false},{id:'ci2',name:'Freelance',emoji:'🖥️',custom:false},
  {id:'ci3',name:'Investimenti',emoji:'📈',custom:false},{id:'ci4',name:'Regalo',emoji:'🎀',custom:false},
  {id:'ci5',name:'Rimborso',emoji:'↩️',custom:false},{id:'ci6',name:'Affitti',emoji:'🏘️',custom:false},
  {id:'ci7',name:'Bonus',emoji:'⭐',custom:false},{id:'ci8',name:'Altro',emoji:'💰',custom:false},
];
const CURRENCIES=[
  {code:'EUR',sym:'€',name:'Euro'},{code:'USD',sym:'$',name:'Dollaro USA'},
  {code:'GBP',sym:'£',name:'Sterlina'},{code:'CHF',sym:'CHF',name:'Franco Svizzero'},
  {code:'JPY',sym:'¥',name:'Yen'},{code:'CAD',sym:'C$',name:'Dollaro CAD'},
];
const ACC_EMOJIS=['💳','💰','🏦','💵','🪙','📱','💎','🏧','🎁','🔑'];
const ACC_COLORS=['#4f8ef7','#30d158','#ff453a','#ffd60a','#bf5af2','#ff9f0a','#32ade6','#ff6b6b','#51cf66','#a29bfe'];
const GRP_EMOJIS=['🍽️','🏖️','🎉','✈️','🏠','🎮','🎓','💼','🏋️','🎵','🍺','🎬','🛒','🚗','⚽','🎁','❤️','🐾','📚','🌿','☕','🎯','🏕️','🎤','🎨'];
const CAT_EMOJIS=['🍔','🍕','🍣','🛒','🚗','🚌','🏠','💊','🛍️','🎬','⚽','📚','✈️','💻','👗','💄','🎁','🐾','💡','📦','🎵','🎮','☕','🍺','🎉','🌿','📱','🔑','🏋️','🎓'];
const CH_COLORS=['#4f8ef7','#30d158','#ff9f0a','#bf5af2','#ff453a','#ffd60a','#32ade6','#ff6b6b','#51cf66','#cc5de8','#ff8c00','#00cec9','#fd79a8','#a29bfe'];
