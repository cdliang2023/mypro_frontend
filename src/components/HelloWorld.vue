<script setup>

import { RouterLink,RouterView } from 'vue-router';



defineProps({
  msg: String,
})

</script>

<template>
<div class="app">
        <h2 class="title">Vue路由测试</h2>
        <div class="navigate">
            <!-- 使用RouterLink标签 to表示跳转的路由 active-class表示路由激活后变成的样式 -->
            <RouterLink to="/home" active-class="active" class=" bg-cyan-300 inline-block rounded-lg mx-2 p-4 no-underline font-bold">首页</RouterLink>
            
            <RouterLink to="/about" active-class="active" class=" bg-sky-100 inline-block rounded-lg mx-2 p-4 no-underline font-bold">关于</RouterLink>
        </div>
        <!-- 展示区 -->
        <div class="main-content">

          <RouterView></RouterView>
          
        
        </div>
    </div>

  
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
