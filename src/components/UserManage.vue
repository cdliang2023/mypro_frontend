<template>
  <div class="user-manage-page">
    <div class="user-manage-card">
      <div class="user-manage-header">
        <div>
          <h2>用户管理</h2>
          <p>可对系统用户进行查询、新增、修改、删除和下载权限管理。</p>
        </div>

        <button class="manage-add-btn" @click="openAddDialog">
          新增用户
        </button>
      </div>

      <div class="user-toolbar">
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="请输入用户名、QQ号或地址"
          @keyup.enter="searchUsers"
        />

        <button class="search-btn" @click="searchUsers">
          查询
        </button>

        <button class="reset-btn" @click="resetSearch">
          重置
        </button>
      </div>

      <el-table
        :data="userList"
        border
        stripe
        v-loading="loading"
        style="width: 100%;"
      >
        <el-table-column
          prop="usrName"
          label="用户名"
          align="center"
          min-width="140"
        />

        <el-table-column
          label="头像"
          align="center"
          width="90"
        >
          <template #default="{ row }">
            <img
              :src="getAvatarUrl(row.avatar)"
              class="manage-avatar"
              alt="头像"
              @error="e => e.target.src = defaultAvatar"
            />
          </template>
        </el-table-column>

        <el-table-column
          prop="qqnum"
          label="QQ号"
          align="center"
          min-width="140"
        />

        <el-table-column
          prop="address"
          label="地址"
          align="center"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column
          label="下载权限"
          align="center"
          width="120"
        >
          <template #default="{ row }">
            <span
              v-if="Number(row.downloadRight || 0) > 0"
              class="right-open"
            >
              已开通
            </span>

            <span
              v-else
              class="right-close"
            >
              未开通
            </span>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          align="center"
          width="190"
        >
          <template #default="{ row }">
            <button class="table-edit-btn" @click="openEditDialog(row)">
              修改
            </button>

            <button class="table-delete-btn" @click="deleteUser(row)">
              删除
            </button>
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
          @current-change="fetchUsers"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '修改用户'"
      width="480px"
      :close-on-click-modal="false"
    >
      <form class="dialog-form" @submit.prevent="submitUser">
        <div class="form-item">
          <label>用户名</label>
          <input
            type="text"
            v-model="userForm.usrName"
            :disabled="dialogMode === 'edit'"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-item">
          <label>
            密码
            <span v-if="dialogMode === 'edit'" class="password-tip">
              不填写则保持原密码
            </span>
          </label>
          <input
            type="password"
            v-model="userForm.password"
            :placeholder="dialogMode === 'add' ? '请输入密码' : '不修改密码可留空'"
          />
        </div>

        <div class="form-row">
          <div class="form-item">
            <label>QQ号</label>
            <input
              type="text"
              v-model="userForm.qqnum"
              placeholder="请输入QQ号"
            />
          </div>

          <div class="form-item">
            <label>下载权限</label>
            <el-switch
              v-model="userForm.downloadRight"
              :active-value="1"
              :inactive-value="0"
              active-text="开通"
              inactive-text="关闭"
            />
          </div>
        </div>

        <div class="form-item">
          <label>地址</label>
          <input
            type="text"
            v-model="userForm.address"
            placeholder="请输入地址"
          />
        </div>

        <div class="form-item">
          <label>头像</label>

          <div class="avatar-select-row">
            <el-select
              v-model="userForm.avatar"
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
                <div class="avatar-option">
                  <img :src="item.img" />
                  <span>{{ item.label }}</span>
                </div>
              </el-option>
            </el-select>

            <div class="avatar-preview">
              <img
                :src="getAvatarUrl(userForm.avatar)"
                alt="头像预览"
                @error="e => e.target.src = defaultAvatar"
              />
            </div>
          </div>
        </div>

        <div class="dialog-buttons">
          <button type="submit" class="btn-submit">
            保存
          </button>

          <button type="button" class="btn-cancel" @click="closeDialog">
            取消
          </button>
        </div>
      </form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE_URL = 'http://localhost:8080/api'

const keyword = ref('')
const userList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref('add')

const userForm = ref({
  usrName: '',
  password: '',
  qqnum: '',
  address: '',
  avatar: '',
  downloadRight: 0
})

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

avatarList.value.sort((a, b) => parseInt(a.value) - parseInt(b.value))

const defaultAvatar =
  avatarImages['/src/assets/image/default.jpg'] ||
  avatarList.value[0]?.img ||
  ''

onMounted(() => {
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/users`, {
      params: {
        keyword: keyword.value.trim(),
        page: currentPage.value,
        size: pageSize.value
      }
    })

    if (res.data && res.data.success) {
      userList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message || '用户查询失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('用户查询失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

function searchUsers() {
  currentPage.value = 1
  fetchUsers()
}

function resetSearch() {
  keyword.value = ''
  currentPage.value = 1
  fetchUsers()
}

function openAddDialog() {
  dialogMode.value = 'add'

  userForm.value = {
    usrName: '',
    password: '',
    qqnum: '',
    address: '',
    avatar: '',
    downloadRight: 0
  }

  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogMode.value = 'edit'

  userForm.value = {
    usrName: row.usrName || '',
    password: '',
    qqnum: row.qqnum || '',
    address: row.address || '',
    avatar: row.avatar || '',
    downloadRight: Number(row.downloadRight || 0)
  }

  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function submitUser() {
  const usrName = userForm.value.usrName.trim()
  const password = userForm.value.password.trim()

  if (!usrName) {
    ElMessage.warning('用户名不能为空')
    return
  }

  if (dialogMode.value === 'add' && !password) {
    ElMessage.warning('新增用户时密码不能为空')
    return
  }

  const payload = {
    usrName,
    password,
    qqnum: userForm.value.qqnum.trim(),
    address: userForm.value.address.trim(),
    avatar: userForm.value.avatar || '',
    downloadRight: Number(userForm.value.downloadRight || 0)
  }

  try {
    let res

    if (dialogMode.value === 'add') {
      res = await axios.post(`${API_BASE_URL}/users`, payload)
    } else {
      res = await axios.put(
        `${API_BASE_URL}/users/${encodeURIComponent(usrName)}`,
        payload
      )
    }

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '保存成功')
      dialogVisible.value = false
      fetchUsers()
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败，请检查后端接口')
  }
}

async function deleteUser(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.usrName}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await axios.delete(
      `${API_BASE_URL}/users/${encodeURIComponent(row.usrName)}`
    )

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '删除成功')

      if (userList.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }

      fetchUsers()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }

    console.error(error)
    ElMessage.error('删除失败，请检查后端接口')
  }
}

function getAvatarUrl(filename) {
  if (!filename) {
    return defaultAvatar
  }

  const found = avatarList.value.find(item => item.value === filename)
  return found ? found.img : defaultAvatar
}
</script>

<style scoped>
.user-manage-page {
  padding: 24px;
  background-color: #f5f9fa;
  min-height: 520px;
}

.user-manage-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 6px 20px rgba(20, 60, 90, 0.08);
}

.user-manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.user-manage-header h2 {
  color: #1e4663;
  font-size: 1.7rem;
  margin-bottom: 6px;
}

.user-manage-header p {
  color: #6c7a86;
  font-size: 0.95rem;
}

.user-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.search-input {
  flex: 1;
  padding: 9px 14px;
  border: 1px solid #cfdfe8;
  border-radius: 20px;
  outline: none;
}

.search-input:focus {
  border-color: #5f9bbf;
  box-shadow: 0 0 0 2px rgba(95, 155, 191, 0.18);
}

.manage-add-btn,
.search-btn,
.reset-btn,
.table-edit-btn,
.table-delete-btn {
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.manage-add-btn {
  padding: 9px 20px;
  background-color: #2c6e8f;
  color: #ffffff;
}

.manage-add-btn:hover {
  background-color: #1e4f6e;
}

.search-btn {
  padding: 8px 20px;
  background-color: #2c6e8f;
  color: #ffffff;
}

.search-btn:hover {
  background-color: #1e4f6e;
}

.reset-btn {
  padding: 8px 20px;
  background-color: #8b9aaa;
  color: #ffffff;
}

.reset-btn:hover {
  background-color: #6f7f8f;
}

.table-edit-btn {
  padding: 6px 14px;
  margin-right: 8px;
  background-color: #4f8f7a;
  color: white;
}

.table-edit-btn:hover {
  background-color: #3d7564;
}

.table-delete-btn {
  padding: 6px 14px;
  background-color: #b85c5c;
  color: white;
}

.table-delete-btn:hover {
  background-color: #994646;
}

.manage-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5edf3;
}

.right-open {
  color: #2c6e8f;
  font-weight: 600;
}

.right-close {
  color: #a0a8b0;
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.password-tip {
  color: #8b9aaa;
  font-size: 12px;
  font-weight: 400;
  margin-left: 6px;
}

.avatar-select-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-option img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

@media (max-width: 760px) {
  .user-manage-header,
  .user-toolbar,
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .manage-add-btn,
  .search-btn,
  .reset-btn {
    width: 100%;
  }
}
</style>