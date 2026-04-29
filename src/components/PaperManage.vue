<template>
  <div class="paper-manage-page">
    <div class="paper-manage-card">
      <div class="paper-manage-header">
        <div>
          <h2>论文管理</h2>
          <p>可对论文信息进行查询、新增、修改、删除，并上传真实论文文件。</p>
        </div>

        <button class="manage-add-btn" @click="openAddDialog">
          新增论文
        </button>
      </div>

      <div class="paper-toolbar">
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="请输入标题、摘要、作者或文件名"
          @keyup.enter="searchPapers"
        />

        <button class="search-btn" @click="searchPapers">
          查询
        </button>

        <button class="reset-btn" @click="resetSearch">
          重置
        </button>
      </div>

      <el-table
        :data="paperList"
        border
        stripe
        v-loading="loading"
        style="width: 100%;"
      >
        <el-table-column prop="id" label="ID" align="center" width="80" />

        <el-table-column
          prop="title"
          label="论文标题"
          align="center"
          min-width="180"
          show-overflow-tooltip
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

        <el-table-column prop="author" label="作者" align="center" width="120" />

        <el-table-column
          prop="downloadUrl"
          label="已保存文件"
          align="center"
          min-width="220"
          show-overflow-tooltip
        />

        <el-table-column label="操作" align="center" width="190">
          <template #default="{ row }">
            <button class="table-edit-btn" @click="openEditDialog(row)">
              修改
            </button>

            <button class="table-delete-btn" @click="deletePaper(row)">
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
          @current-change="fetchPapers"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增论文' : '修改论文'"
      width="640px"
      :close-on-click-modal="false"
    >
      <form class="dialog-form" @submit.prevent="submitPaper">
        <div class="form-item">
          <label>论文标题</label>
          <input
            type="text"
            v-model="paperForm.title"
            placeholder="请输入论文标题"
          />
        </div>

        <div class="form-item">
          <label>作者</label>
          <input
            type="text"
            v-model="paperForm.author"
            placeholder="请输入作者"
          />
        </div>

        <div class="form-item">
          <label>
            论文文件
            <span v-if="dialogMode === 'edit'" class="file-tip-inline">
              不重新选择文件则保持原文件
            </span>
          </label>

          <input
            ref="fileInputRef"
            type="file"
            class="file-input"
            accept=".pdf,.doc,.docx,.txt"
            @change="handleFileChange"
          />

          <p class="path-tip" v-if="selectedFileName">
            当前选择：{{ selectedFileName }}
          </p>

          <p class="path-tip" v-else-if="dialogMode === 'edit' && paperForm.downloadUrl">
            当前文件：{{ paperForm.downloadUrl }}
          </p>

          <p class="path-tip">
            文件会自动保存到系统论文目录中，并按“作者名_序号”命名，例如 chen_1.pdf。
          </p>
        </div>

        <div class="form-item">
          <label>摘要</label>
          <textarea
            v-model="paperForm.abstractTxt"
            placeholder="请输入论文摘要"
            rows="6"
          ></textarea>
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
const paperList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const dialogVisible = ref(false)
const dialogMode = ref('add')

const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFileName = ref('')

const paperForm = ref({
  id: null,
  title: '',
  abstractTxt: '',
  author: '',
  downloadUrl: ''
})

onMounted(() => {
  fetchPapers()
})

async function fetchPapers() {
  loading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/papers`, {
      params: {
        keyword: keyword.value.trim(),
        page: currentPage.value,
        size: pageSize.value
      }
    })

    if (res.data && res.data.success) {
      paperList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message || '论文查询失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('论文查询失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

function searchPapers() {
  currentPage.value = 1
  fetchPapers()
}

function resetSearch() {
  keyword.value = ''
  currentPage.value = 1
  fetchPapers()
}

function openAddDialog() {
  dialogMode.value = 'add'

  paperForm.value = {
    id: null,
    title: '',
    abstractTxt: '',
    author: '',
    downloadUrl: ''
  }

  clearSelectedFile()
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogMode.value = 'edit'

  paperForm.value = {
    id: row.id,
    title: row.title || '',
    abstractTxt: row.abstractTxt || '',
    author: row.author || '',
    downloadUrl: row.downloadUrl || ''
  }

  clearSelectedFile()
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  clearSelectedFile()
}

function handleFileChange(event) {
  const file = event.target.files && event.target.files[0]

  if (!file) {
    selectedFile.value = null
    selectedFileName.value = ''
    return
  }

  const name = file.name.toLowerCase()

  if (
    !name.endsWith('.pdf') &&
    !name.endsWith('.doc') &&
    !name.endsWith('.docx') &&
    !name.endsWith('.txt')
  ) {
    ElMessage.warning('只允许上传 pdf、doc、docx、txt 文件')
    clearSelectedFile()
    return
  }

  selectedFile.value = file
  selectedFileName.value = file.name
}

function clearSelectedFile() {
  selectedFile.value = null
  selectedFileName.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function submitPaper() {
  const title = paperForm.value.title.trim()

  if (!title) {
    ElMessage.warning('论文标题不能为空')
    return
  }

  if (dialogMode.value === 'add' && !selectedFile.value) {
    ElMessage.warning('新增论文时必须上传论文文件')
    return
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('abstractTxt', paperForm.value.abstractTxt.trim())
  formData.append('author', paperForm.value.author.trim())

  if (selectedFile.value) {
    formData.append('file', selectedFile.value)
  }

  try {
    let res

    if (dialogMode.value === 'add') {
      res = await axios.post(`${API_BASE_URL}/papers`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      res = await axios.put(
        `${API_BASE_URL}/papers/${paperForm.value.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
    }

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '保存成功')
      dialogVisible.value = false
      clearSelectedFile()
      fetchPapers()
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败，请检查后端接口或文件大小')
  }
}

async function deletePaper(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除论文「${row.title}」吗？该操作会删除数据库记录，并尝试删除已上传的论文文件。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await axios.delete(`${API_BASE_URL}/papers/${row.id}`)

    if (res.data && res.data.success) {
      ElMessage.success(res.data.message || '删除成功')

      if (paperList.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }

      fetchPapers()
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
</script>

<style scoped>
.paper-manage-page {
  padding: 24px;
  background-color: #f5f9fa;
  min-height: 520px;
}

.paper-manage-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 6px 20px rgba(20, 60, 90, 0.08);
}

.paper-manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.paper-manage-header h2 {
  color: #1e4663;
  font-size: 1.7rem;
  margin-bottom: 6px;
}

.paper-manage-header p {
  color: #6c7a86;
  font-size: 0.95rem;
}

.paper-toolbar {
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

.file-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #cfdfe8;
  border-radius: 14px;
  background-color: #ffffff;
}

.dialog-form textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cfdfe8;
  border-radius: 14px;
  outline: none;
  resize: vertical;
  font-size: 0.95rem;
  font-family: inherit;
  transition: 0.2s;
}

.dialog-form textarea:focus {
  border-color: #5f9bbf;
  box-shadow: 0 0 0 2px rgba(95, 155, 191, 0.2);
}

.path-tip {
  margin-top: 6px;
  color: #8b9aaa;
  font-size: 0.85rem;
  line-height: 1.5;
}

.file-tip-inline {
  color: #8b9aaa;
  font-size: 12px;
  font-weight: 400;
  margin-left: 6px;
}

.pagination-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: center;
}

@media (max-width: 760px) {
  .paper-manage-header,
  .paper-toolbar {
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