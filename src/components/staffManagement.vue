<template>
  <div class="app">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <!-- 背景图片容器 -->
      <div class="navbar-background">
        <div
          v-for="(image, index) in images"
          :key="index"
          class="background-image"
          :class="{
            active: currentImageIndex === index,
            'fade-out': isFadingOut && currentImageIndex === index
          }"
          :style="{ backgroundImage: `url(${image})` }"
        ></div>
      </div>

      <div class="nav-text">
        <h1>论文管理信息系统</h1>
        <p>Article Management · 分享 · 阅读</p>
      </div>
    </div>

    <!-- 菜单栏 -->
    <div class="menu-bar">
      <div class="menu-list">
        <div class="menu-left">
          <a
            href="#"
            :class="{ active: currentView === 'first' }"
            @click.prevent="goHome"
          >
            首页
          </a>

          <a
            href="#"
            :class="{ active: currentView === 'book' }"
            @click.prevent="handleBook"
          >
            专业书籍
          </a>

          <a href="#" @click.prevent="handleWorkingPaper">
            工作论文
          </a>

          <a href="#" @click.prevent="handleLatest">
            最新文献
          </a>
        </div>

        <!-- 系统管理下拉菜单 -->
        <div class="menu-right">
          <el-dropdown
            trigger="hover"
            popper-class="system-dropdown-popper"
            @command="handleSystemCommand"
          >
            <span class="system-menu-link">
              系统管理
              <span class="system-arrow">▼</span>
            </span>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="userManage">
                  用户管理
                </el-dropdown-item>

                <el-dropdown-item command="paperManage">
                  论文管理
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <keep-alive>
      <component
        :is="currentComponent"
        :current-user="currentUser"
        @login-success="handleLoginSuccess"
        @logout-success="handleLogoutSuccess"
      />
    </keep-alive>

    <!-- 管理员动态密码验证弹窗 -->
    <el-dialog
      v-model="adminDialogVisible"
      title="管理员身份验证"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="admin-auth-form">
        <div class="form-item">
          <label>管理员名称</label>
          <input
            type="text"
            v-model="adminForm.adminName"
            placeholder="请输入管理员名称"
          />
        </div>

        <div class="form-item">
          <label>动态密码</label>
          <div class="code-row">
            <input
              type="text"
              v-model="adminForm.code"
              placeholder="请输入手机收到的动态密码"
            />

            <button
              type="button"
              class="send-code-btn"
              :disabled="codeSending || countdown > 0"
              @click="sendAdminCode"
            >
              {{ countdown > 0 ? countdown + '秒后重发' : '获取动态密码' }}
            </button>
          </div>
        </div>

        <p class="auth-tip">
          动态密码将发送至系统绑定的管理员手机。
        </p>

        <div class="dialog-buttons">
          <button type="button" class="btn-submit" @click="verifyAdmin">
            验证并进入
          </button>

          <button type="button" class="btn-cancel" @click="closeAdminDialog">
            取消
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

import First from './First.vue'
import Book from './Book.vue'
import UserManage from './UserManage.vue'
import PaperManage from './PaperManage.vue'

// 导入本地图片
import index0 from '../assets/image/index/index0.jpg'
import index1 from '../assets/image/index/index1.jpg'
import index2 from '../assets/image/index/index2.jpg'
import index3 from '../assets/image/index/index3.jpg'
import index4 from '../assets/image/index/index4.jpg'
import index5 from '../assets/image/index/index5.jpg'

const API_BASE_URL = 'http://localhost:8080/api'

const adminAuthed = ref(sessionStorage.getItem('adminAuthed') === 'true')

// 当前显示的页面
const currentView = ref('first')

// 当前登录用户，由 First.vue 登录成功后传过来
const currentUser = ref(null)

const isLogin = computed(() => {
  return !!currentUser.value
})

const adminDialogVisible = ref(false)
const pendingTargetView = ref('')

const codeSending = ref(false)
const countdown = ref(0)
let countdownTimer = null

const adminForm = ref({
  adminName: 'admin',
  code: ''
})

// 图片轮播相关
const images = [index0, index1, index2, index3, index4, index5]
const currentImageIndex = ref(0)
const isFadingOut = ref(false)
let imageRotationTimer = null

// 当前动态组件
const currentComponent = computed(() => {
  if (currentView.value === 'first') {
    return First
  }

  if (currentView.value === 'book') {
    return Book
  }

  if (currentView.value === 'userManage') {
    return UserManage
  }

  if (currentView.value === 'paperManage') {
    return PaperManage
  }

  return First
})

// 组件挂载时：恢复登录状态 + 启动顶部图片轮播
onMounted(() => {
  loadLoginState()
  startImageRotation()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (imageRotationTimer) {
    clearInterval(imageRotationTimer)
    imageRotationTimer = null
  }

  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

// 从 localStorage 恢复登录状态
function loadLoginState() {
  const savedUser = localStorage.getItem('currentUser')

  if (!savedUser) {
    currentUser.value = null
    return
  }

  try {
    currentUser.value = JSON.parse(savedUser)
  } catch (error) {
    console.error('恢复登录状态失败：', error)
    currentUser.value = null
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')
  }
}

// 图片轮播函数
function rotateImage() {
  isFadingOut.value = true

  setTimeout(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % images.length
    isFadingOut.value = false
  }, 3000)
}

// 启动图片轮播
function startImageRotation() {
  if (imageRotationTimer) {
    clearInterval(imageRotationTimer)
  }

  imageRotationTimer = setInterval(rotateImage, 10000)
}

// 首页
function goHome() {
  currentView.value = 'first'
}

// 专业书籍
function handleBook() {
  loadLoginState()

  if (!isLogin.value) {
    ElMessage.warning('请先完成登录，再查看专业书籍')
    currentView.value = 'first'
    return
  }

  currentView.value = 'book'
}

// First.vue 登录成功后触发
function handleLoginSuccess(user) {
  currentUser.value = user
  localStorage.setItem('currentUser', JSON.stringify(user))
}

// First.vue 退出登录后触发
function handleLogoutSuccess() {
  currentUser.value = null
  localStorage.removeItem('currentUser')
  localStorage.removeItem('token')
  currentView.value = 'first'
}

// 工作论文
function handleWorkingPaper() {
  ElMessage.info('工作论文功能开发中')
}

// 最新文献
function handleLatest() {
  ElMessage.info('最新文献功能开发中')
}

// 系统管理菜单
function handleSystemCommand(command) {
  if (command !== 'userManage' && command !== 'paperManage') {
    return
  }

  if (adminAuthed.value) {
    currentView.value = command
    return
  }

  openAdminDialog(command)
}

function openAdminDialog(targetView) {
  pendingTargetView.value = targetView
  adminForm.value = {
    adminName: 'admin',
    code: ''
  }
  adminDialogVisible.value = true
}

function closeAdminDialog() {
  adminDialogVisible.value = false
  pendingTargetView.value = ''
  adminForm.value.code = ''
}

async function sendAdminCode() {
  const adminName = adminForm.value.adminName.trim()

  if (!adminName) {
    ElMessage.warning('请输入管理员名称')
    return
  }

  if (adminName !== 'admin') {
    ElMessage.error('管理员名称不正确')
    return
  }

  try {
    codeSending.value = true

    const res = await axios.post(`${API_BASE_URL}/admin/user-manage/send-code`, {
      adminName
    })

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '动态密码已发送')
      startCountdown()
    } else {
      ElMessage.error(res.data.message || '动态密码发送失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('动态密码发送失败，请检查后端服务')
  } finally {
    codeSending.value = false
  }
}

async function verifyAdmin() {
  const adminName = adminForm.value.adminName.trim()
  const code = adminForm.value.code.trim()

  if (!adminName) {
    ElMessage.warning('请输入管理员名称')
    return
  }

  if (!code) {
    ElMessage.warning('请输入动态密码')
    return
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/admin/user-manage/verify`, {
      adminName,
      code
    })

    if (res.data && res.data.success) {
  ElMessage.success(res.data.message || '验证成功')

  adminAuthed.value = true
  sessionStorage.setItem('adminAuthed', 'true')

  currentView.value = pendingTargetView.value || 'userManage'

  closeAdminDialog()
}else {
      ElMessage.error(res.data.message || '管理员验证失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('管理员验证失败，请检查后端服务')
  }
}

function startCountdown() {
  countdown.value = 60

  if (countdownTimer) {
    clearInterval(countdownTimer)
  }

  countdownTimer = setInterval(() => {
    countdown.value -= 1

    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}
</script>