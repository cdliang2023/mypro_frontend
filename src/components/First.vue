<template>
  <!-- 主体区域 -->
  <div class="main-container">
    <!-- 左侧区域 -->
    <div class="left-table">
      <!-- 未登录时：不显示空分页器 -->
      <template v-if="!isLogin">
        <div class="empty-panel">
          <h2>欢迎使用论文管理信息系统</h2>
          <p>请先在右侧登录。登录成功后，这里将分页显示论文信息。</p>
        </div>
      </template>

      <!-- 登录成功后：显示文章表格和分页器 -->
      <template v-else>
        <div class="section-header">
          <div class="user-header">
            <img
              :src="getAvatarUrl(currentUser?.avatar)"
              class="header-avatar"
              alt="用户头像"
              @error="e => e.target.src = defaultAvatar"
            />

            <div>
              <p style="color: blue; font-weight: bold;">
                当前用户：{{ currentUser?.usrName }}
              </p>

              <p
                v-if="hasDownloadRight"
                style="color: #2c6e8f; font-size: 0.9rem;"
              >
                下载权限：已开通
              </p>

              <p
                v-else
                style="color: #a0a8b0; font-size: 0.9rem;"
              >
                下载权限：未开通
              </p>
            </div>
          </div>

          <div>
            <h1>近期论文列表</h1>
          </div>

          <button class="logout-btn" @click="logout">
            退出登录
          </button>
        </div>

        <el-table
          :data="tableData"
          stripe
          border
          style="width: 100%"
          v-loading="articleLoading"
        >
          <el-table-column
            prop="title"
            label="文章名称"
            align="center"
            min-width="160"
          />

          <el-table-column
            prop="abstractTxt"
            label="摘要"
            align="center"
            min-width="260"
            :show-overflow-tooltip="{
              popperClass: 'abstract-tooltip'
            }"
          />

          <el-table-column
            prop="author"
            label="作者"
            align="center"
            width="120"
          />

          <el-table-column
            label="下载"
            align="center"
            width="120"
          >
            <template #default="{ row }">
              <a
                v-if="hasDownloadRight"
                href="#"
                target="_blank"
                class="download-link"
                @click.prevent="handleDownload(row)"
              >
                下载
              </a>

              <span
                v-else
                class="download-disabled"
                title="当前用户没有下载权限"
              >
                下载
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap">
          <el-pagination
            background
            layout="prev, pager, next, jumper, total"
            :page-size="pageSize"
            :total="total"
            v-model:current-page="currentPage"
            @current-change="fetchArticles"
          />
        </div>
      </template>
    </div>

    <!-- 右侧登录表单 -->
    <div class="right-forms">
      <div class="tile login-tile">
        <form @submit.prevent="handleLogin">
          <h3>用户登录</h3>

          <p>
            <label for="login-username">用户名：</label>
            <input
              id="login-username"
              type="text"
              v-model="loginForm.username"
              placeholder="请输入用户名"
            />
          </p>

          <p>
            <label for="login-password">密码：</label>
            <input
              id="login-password"
              type="password"
              v-model="loginForm.password"
              placeholder="请输入密码"
            />
          </p>

          <div class="button-group">
            <button type="submit" class="btn-submit">
              登录系统
            </button>

            <button
              type="button"
              class="btn-register"
              @click="openRegisterDialog"
            >
              注册账号
            </button>
          </div>

          <div class="login-status" v-if="isLogin">
            已登录：{{ currentUser?.usrName }}
          </div>

          <div class="login-status not-login" v-else>
            当前未登录
          </div>
        </form>
      </div>

      <div class="tile info-tile">
        <h3>系统说明</h3>
        <p class="info-text">
          登录成功后，左侧才显示论文信息。没有账号时，请点击上方“注册账号”。
        </p>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <el-dialog
      v-model="registerDialogVisible"
      title="新用户注册"
      width="430px"
      :close-on-click-modal="false"
    >
      <form class="dialog-form" @submit.prevent="handleRegister">
        <div class="form-item">
          <label>用户名</label>
          <input
            type="text"
            v-model="registerForm.usrName"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input
            type="password"
            v-model="registerForm.password"
            placeholder="请输入密码"
          />
        </div>

        <div style="display: flex; gap: 16px;">
          <div class="form-item" style="flex: 1;">
            <label>QQ号</label>
            <input
              type="text"
              v-model="registerForm.qqnum"
              placeholder="请输入QQ号"
            />
          </div>

          <div class="form-item" style="flex: 1;">
            <label>头像</label>

            <div style="display: flex; gap: 12px; align-items: center;">
              <el-select
                v-model="registerForm.avatar"
                placeholder="请选择头像"
                style="flex: 1"
                popper-class="avatar-popper"
              >
                <el-option
                  v-for="item in avatarList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <img
                      :src="item.img"
                      style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </el-option>
              </el-select>

              <div class="avatar-preview">
                <img
                  :src="getAvatarUrl(registerForm.avatar)"
                  alt="头像预览"
                  @error="e => e.target.src = defaultAvatar"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-item">
          <label>地址</label>
          <input
            type="text"
            v-model="registerForm.address"
            placeholder="请输入地址"
          />
        </div>

        <div class="dialog-buttons">
          <button type="submit" class="btn-submit">
            完成注册
          </button>

          <button
            type="button"
            class="btn-cancel"
            @click="closeRegisterDialog"
          >
            取消
          </button>
        </div>
      </form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['login-success', 'logout-success'])

const API_BASE_URL = 'http://localhost:8080/api'
const API_HOST = 'http://localhost:8080'

// 如果后端在 192.168.2.19，可以改成：
// const API_BASE_URL = 'http://192.168.2.19:8080/api'
// const API_HOST = 'http://192.168.2.19:8080'

const isLogin = ref(false)
const currentUser = ref(null)

const hasDownloadRight = computed(() => {
  return Number(currentUser.value?.downloadRight || 0) > 0
})

const loginForm = ref({
  username: '',
  password: ''
})

const registerDialogVisible = ref(false)

const registerForm = ref({
  usrName: '',
  password: '',
  qqnum: '',
  address: '',
  avatar: ''
})

const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)
const articleLoading = ref(false)

// 加载头像图片
const avatarImages = import.meta.glob('/src/assets/image/*.jpg', {
  eager: true,
  import: 'default'
})

const avatarList = ref([])
const avatarLabels = [
  '可爱',
  '活泼',
  '友善',
  '严肃',
  '温暖',
  '礼貌',
  '亲近',
  '开心',
  '敬重'
]

Object.keys(avatarImages).forEach(path => {
  const match = path.match(/\/(\d+)\.jpg$/)

  if (match) {
    const num = parseInt(match[1])
    const imgUrl = avatarImages[path]
    const label = avatarLabels[num - 1] || `头像${num}`

    avatarList.value.push({
      value: `${num}.jpg`,
      label,
      img: imgUrl
    })
  }
})

avatarList.value.sort((a, b) => {
  return parseInt(a.value) - parseInt(b.value)
})

const defaultAvatar =
  avatarImages['/src/assets/image/default.jpg'] ||
  avatarList.value[0]?.img ||
  ''

onMounted(() => {
  restoreLoginState()
})

function restoreLoginState() {
  const savedUser = localStorage.getItem('currentUser')

  if (!savedUser) {
    return
  }

  try {
    const user = JSON.parse(savedUser)

    isLogin.value = true
    currentUser.value = user

    emit('login-success', user)

    currentPage.value = 1
    fetchArticles()
  } catch (error) {
    console.error('恢复登录状态失败：', error)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')
  }
}

async function handleLogin() {
  const username = loginForm.value.username.trim()
  const password = loginForm.value.password.trim()

  if (!username || !password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/login`, {
      usrName: username,
      password
    })

    if (res.data && res.data.success) {
      isLogin.value = true

      // 兼容两种返回格式：
      // 1. data 直接是用户对象
      // 2. data = { token, user }
      const loginData = res.data.data
      const user = loginData?.user || loginData

      currentUser.value = user

      localStorage.setItem('currentUser', JSON.stringify(user))

      if (loginData?.token) {
        localStorage.setItem('token', loginData.token)
      }

      emit('login-success', user)

      ElMessage.success(res.data.message || '登录成功')

      currentPage.value = 1
      await fetchArticles()
    } else {
      clearLoginState(false)
      ElMessage.error(res.data.message || '用户名或密码错误')
    }
  } catch (error) {
    console.error(error)
    clearLoginState(false)
    ElMessage.error('登录请求失败，请检查后端服务')
  }
}

async function fetchArticles() {
  if (!isLogin.value) {
    return
  }

  articleLoading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/articles`, {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    })

    if (res.data && res.data.success) {
      tableData.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message || '论文加载失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('论文加载失败，请检查后端接口')
  } finally {
    articleLoading.value = false
  }
}

function getDownloadUrl(url) {
  if (!url) {
    return '#'
  }

  const username = currentUser.value?.usrName || ''

  if (!username) {
    return '#'
  }

  const separator = url.includes('?') ? '&' : '?'

  if (url.startsWith('http')) {
    return `${url}${separator}usrName=${encodeURIComponent(username)}`
  }

  return `${API_HOST}${url}${separator}usrName=${encodeURIComponent(username)}`
}

function openRegisterDialog() {
  registerDialogVisible.value = true
}

function closeRegisterDialog() {
  registerDialogVisible.value = false
}

async function handleRegister() {
  const usrName = registerForm.value.usrName.trim()
  const password = registerForm.value.password.trim()
  const qqnum = registerForm.value.qqnum.trim()
  const address = registerForm.value.address.trim()

  if (!usrName || !password) {
    ElMessage.warning('用户名和密码不能为空')
    return
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/register`, {
      usrName,
      password,
      qqnum,
      address,
      avatar: registerForm.value.avatar || ''
    })

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '注册成功，请登录')

      loginForm.value.username = usrName
      loginForm.value.password = password

      resetRegisterForm()
      registerDialogVisible.value = false
    } else {
      ElMessage.error(res.data.message || '注册失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('注册请求失败，请检查后端服务')
  }
}

function resetRegisterForm() {
  registerForm.value = {
    usrName: '',
    password: '',
    qqnum: '',
    address: '',
    avatar: ''
  }
}

function getAvatarUrl(filename) {
  if (!filename) {
    return defaultAvatar
  }

  const found = avatarList.value.find(item => item.value === filename)
  return found ? found.img : defaultAvatar
}

function logout() {
  clearLoginState(true)
  ElMessage.info('已退出登录')
}

function clearLoginState(needEmit = true) {
  isLogin.value = false
  currentUser.value = null
  tableData.value = []
  total.value = 0
  currentPage.value = 1

  localStorage.removeItem('currentUser')
  localStorage.removeItem('token')

  if (needEmit) {
    emit('logout-success')
  }
}

function handleDownload(row) {
  const url = getDownloadUrl(row.downloadUrl)

  if (!url || url === '#') {
    ElMessage.warning('下载地址无效')
    return
  }

  window.location.href = url
}
</script>

<style>
.abstract-tooltip {
  max-width: 400px !important;
  width: 400px !important;
  white-space: normal !important;
  word-break: break-word !important;
  line-height: 1.75;

  background-color: #fffaf0 !important;
  color: #3f3a2f !important;
  border: 1px solid #e6d7b8 !important;
  border-radius: 10px !important;
  padding: 13px 15px !important;
  box-shadow: 0 8px 22px rgba(88, 72, 38, 0.18) !important;
  font-size: 14px;
}

.abstract-tooltip .el-popper__arrow::before {
  background-color: #fffaf0 !important;
  border: 1px solid #e6d7b8 !important;
}
</style>