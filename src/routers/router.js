// 1.导入组件以及路由创建器
import { createRouter, createWebHistory } from "vue-router";
import Home from '../components/RouterTest/Home.vue';
import About from '../components/RouterTest/About.vue';

// 2.将组件对应响应的路由
const router = createRouter({
    history:createWebHistory(),
    routes:[
        {
            path:'/home',
            component:Home
        },
        {
            path:'/about',
            component:About
        }
    ]
})
// 3.将路由器暴露
export default router
