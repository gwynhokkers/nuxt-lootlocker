import NuxtLootLocker from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtLootLocker],
  lootlocker: {
    gameKey: 'game-key',
    domainKey: 'domain-key',
    serverKey: 'server-key',
    features: { stripe: false },
  },
})
