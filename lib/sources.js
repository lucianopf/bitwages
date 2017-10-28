module.exports.exchanges = ['NEG', 'B2U', 'FLW', 'WAL', 'FOX', 'MBT', 'ARN', 'Bitwage']
module.exports.exchangesLabels = {
  FLW: 'FlowBTC',
  FOX: 'FoxBit',
  MBT: 'Mercado Bitcoin',
  ARN: 'Arena Bitcoin',
  B2U: 'BitcoinToYou',
  LOC: 'LocalBitcoins',
  NEG: 'Negocie Coins',
  WAL: 'WallTime',
  Bitwage: 'Bitwage'
}

module.exports.exchangeTaxes = {
  FLW: {
      deposit: 0.005,
      receiveBTC: 0,
      transferBRL: 0.01,
      transferBTC: 0.001,
      passiveAction: 0.0035,
      activeAction: 0.0035
  },
  FOX: {
      deposit: 0,
      receiveBTC: 0,
      transferBRL: 0.0139,
      transferBTC: 0.00045,
      passiveAction: 0.0025,
      activeAction: 0.005
  },
  MBT: {
      deposit: 0.0199,
      receiveBTC: 0,
      transferBRL: 0.0199,
      transferBTC: 0,
      passiveAction: 0.003,
      activeAction: 0.007
  },
  ARN: {
      deposit: 0,
      receiveBTC: 0,
      transferBRL: 0.0039,
      transferBTC: 0.0015,
      passiveAction: 0.0025,
      activeAction: 0.0025
  },
  B2U: {
      deposit: 0.0189,
      receiveBTC: 0,
      transferBRL: 0.0189,
      transferBTC: 0.0005,
      passiveAction: 0.0025,
      activeAction: 0.006
  },
  LOC: {
      deposit: 0,
      receiveBTC: 0,
      transferBRL: 0,
      transferBTC: 0,
      passiveAction: 0,
      activeAction: 0
  },
  NEG: {
      deposit: 0,
      receiveBTC: 0,
      transferBRL: 0.005,
      transferBTC: 0.0004,
      passiveAction: 0.003,
      activeAction: 0.004
  },
  WAL: {
    deposit: 0,
    receiveBTC: 0,
    transferBRL: 0.0123,
    transferBTC: 0.0000,
    passiveAction: 0.002,
    activeAction: 0.004
  },
  Bitwage: {
      deposit: 0,
      receiveBTC: 0,
      transferBRL: 0,
      transferBTC: 0.025,
      passiveAction: 0,
      activeAction: 0
  }
}