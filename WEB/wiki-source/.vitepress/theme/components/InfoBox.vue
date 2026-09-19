<script setup>
defineProps({
  title: String,
  rows: Array
})
</script>

<template>
  <div class="info-box" style="float: right; border: 1px solid #ccc; padding: 10px; margin-left: 10px; width: 250px;">
    <h3>{{ title }}</h3>
    <table>
      <tr v-for="row in rows" :key="row.label">
        <td><strong>{{ row.label }}</strong></td>
        <td>
          <a v-if="row.link" :href="row.link">{{ row.value }}</a>
          <span v-else>{{ row.value }}</span>
        </td>
      </tr>
    </table>
  </div>
</template>
