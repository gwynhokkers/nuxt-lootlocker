<template>
  <div>{{ state }}</div>
</template>

<script setup lang="ts">
const lootlocker = useLootLocker()
lootlocker.setSessionToken('secret-token')
const state = lootlocker.getSessionToken() ? 'has-token' : 'no-token'
</script>
