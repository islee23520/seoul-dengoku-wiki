<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import {
  ALL, PAGE_SIZE, defaultFilters, initialState, matches, persistFilters, reduce, restoreFilters,
  type PeopleAction, type PeopleState, type PersonRow,
} from '../machines/peopleFilter'

interface Dataset {
  labels: Record<string, string>
  factions: { id: string; name: string }[]
  states: { id: string; name: string }[]
  tiers: string[]
  genders: string[]
  rows: PersonRow[]
}

const props = defineProps<{ locale: 'en' | 'ko'; prefix: string }>()
const data = ref<Dataset | null>(null)
const machine = reactive<PeopleState>(initialState())
const dispatch = (action: PeopleAction) => Object.assign(machine, reduce({ ...machine }, action))

async function load() {
  try {
    const res = await fetch(withBase(`/data/people.${props.locale}.json`))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ds = (await res.json()) as Dataset
    data.value = ds
    Object.assign(machine.filters, restoreFilters(sessionStorage, {
      faction: new Set(ds.factions.map((x) => x.id)), state: new Set(ds.states.map((x) => x.id)),
      tier: new Set(ds.tiers), gender: new Set(ds.genders),
    }))
    dispatch({ type: 'loaded' })
  } catch (e) {
    dispatch({ type: 'failed', message: String((e as Error).message ?? e) })
  }
}
function retry() {
  dispatch({ type: 'retry' })
  void load()
}
onMounted(load)
watch(() => ({ ...machine.filters }), (f) => { if (machine.phase === 'ready') persistFilters(sessionStorage, f) }, { deep: true })

const L = computed(() => data.value?.labels ?? {})
const filtered = computed(() => (data.value ? data.value.rows.filter((r) => matches(r, machine.filters)) : []))
const visible = computed(() => filtered.value.slice(0, machine.shown))
const link = (id: string) => withBase(`/${props.prefix}wiki/people/${id}/`)
const statesForFaction = computed(() => {
  if (!data.value) return []
  if (machine.filters.faction === ALL) return data.value.states
  const inFaction = new Set(data.value.rows.filter((r) => r[12] === machine.filters.faction).map((r) => r[10]))
  return data.value.states.filter((s) => inFaction.has(s.id))
})
function onFaction(value: string) {
  dispatch({ type: 'set', field: 'faction', value })
  // keep the state filter consistent with the chosen faction
  if (machine.filters.state !== ALL && !statesForFaction.value.some((s) => s.id === machine.filters.state)) dispatch({ type: 'set', field: 'state', value: ALL })
}
const isDefault = computed(() => (Object.keys(defaultFilters) as (keyof typeof defaultFilters)[]).every((k) => machine.filters[k] === defaultFilters[k]))
</script>

<template>
  <section class="people-search" :aria-label="L.filters">
    <p v-if="machine.phase === 'loading'" class="ps-status" role="status">{{ L.loading ?? 'Loading…' }}</p>
    <div v-else-if="machine.phase === 'error'" class="ps-status ps-error" role="alert">
      <p>{{ L.failed ?? 'Could not load the people list.' }} ({{ machine.error }})</p>
      <button type="button" @click="retry">{{ L.retry ?? 'Retry' }}</button>
    </div>
    <template v-else-if="data">
      <label class="ps-search"><span>{{ L.search }}</span>
        <input type="search" :value="machine.filters.query" :placeholder="L.searchPh" @input="dispatch({ type: 'set', field: 'query', value: ($event.target as HTMLInputElement).value })" />
      </label>
      <div class="ps-filters" role="group" :aria-label="L.filters">
        <label>{{ L.faction }}
          <select :value="machine.filters.faction" @change="onFaction(($event.target as HTMLSelectElement).value)">
            <option :value="ALL">{{ L.all }}</option><option v-for="f in data.factions" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select></label>
        <label>{{ L.state }}
          <select :value="machine.filters.state" @change="dispatch({ type: 'set', field: 'state', value: ($event.target as HTMLSelectElement).value })">
            <option :value="ALL">{{ L.all }}</option><option v-for="s in statesForFaction" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select></label>
        <label>{{ L.tier }}
          <select :value="machine.filters.tier" @change="dispatch({ type: 'set', field: 'tier', value: ($event.target as HTMLSelectElement).value })">
            <option :value="ALL">{{ L.all }}</option><option v-for="t in data.tiers" :key="t" :value="t">{{ t }}</option>
          </select></label>
        <label>{{ L.gender }}
          <select :value="machine.filters.gender" @change="dispatch({ type: 'set', field: 'gender', value: ($event.target as HTMLSelectElement).value })">
            <option :value="ALL">{{ L.all }}</option><option v-for="g in data.genders" :key="g" :value="g">{{ g }}</option>
          </select></label>
        <label>{{ L.occupation }}
          <input type="search" :value="machine.filters.occupation" :placeholder="L.occupationPh" @input="dispatch({ type: 'set', field: 'occupation', value: ($event.target as HTMLInputElement).value })" /></label>
        <button type="button" class="ps-reset" :disabled="isDefault" @click="dispatch({ type: 'reset' })">{{ L.reset }}</button>
      </div>
      <p class="ps-count" aria-live="polite" data-testid="result-count">{{ filtered.length }} {{ L.results }}</p>
      <div class="table-wrap"><table class="ps-table">
        <thead><tr><th>{{ L.name }}</th><th>{{ L.title }}</th><th>{{ L.state }}</th><th>{{ L.occupation }}</th><th>{{ L.rank }}</th></tr></thead>
        <tbody>
          <tr v-for="r in visible" :key="r[0]" :data-person="r[0]">
            <td><a :href="link(r[0])">{{ r[1] }}</a></td><td>{{ r[3] }}</td><td>{{ r[11] }}</td><td>{{ r[7] }}</td><td>{{ r[5] }}</td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="5">{{ L.none }}</td></tr>
        </tbody>
      </table></div>
      <button v-if="filtered.length > machine.shown" type="button" class="ps-more" @click="dispatch({ type: 'more' })">{{ L.more }} ({{ Math.min(PAGE_SIZE, filtered.length - machine.shown) }})</button>
    </template>
  </section>
</template>

<style scoped>
.people-search { margin: 16px 0; }
.ps-search { display: block; margin-bottom: 12px; }
.ps-search span { display: block; font-size: 13px; color: var(--vp-c-text-2); margin-bottom: 4px; }
.ps-search input, .ps-filters input, .ps-filters select { width: 100%; padding: 8px 10px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); font: inherit; }
.ps-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; align-items: end; margin-bottom: 12px; }
.ps-filters label { font-size: 13px; color: var(--vp-c-text-2); display: grid; gap: 4px; }
.ps-reset, .ps-more { padding: 8px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); cursor: pointer; font: inherit; }
.ps-reset:disabled { opacity: .5; cursor: default; }
.ps-count { margin: 8px 0; font-weight: 600; }
.ps-status { padding: 12px 0; color: var(--vp-c-text-2); }
.ps-error { color: var(--vp-c-danger-1, #b63c32); }
.ps-more { margin-top: 12px; }
.table-wrap { overflow-x: auto; }
</style>
