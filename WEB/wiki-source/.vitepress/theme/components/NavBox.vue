<script setup>
defineProps({
  items: Array
})
</script>

<template>
  <div class="nav-box" style="border: 1px solid #ccc; padding: 10px; margin-top: 20px;">
    <h3>16국</h3>
    <ul style="display: flex; flex-wrap: wrap; list-style: none; padding: 0;">
      <li v-for="item in items" :key="item.name" style="margin-right: 10px;">
        <a :href="item.link">{{ item.name }}</a>
      </li>
    </ul>
  </div>
</template>
