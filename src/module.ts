import { defineNuxtModule } from '@nuxt/kit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@gwynhokkers/nuxt-lootlocker',
    configKey: 'lootlocker',
  },
  defaults: {},
  setup() {},
})
