<template>
  <div class="main-container">
    <div class="left-table">
      <template v-if="!isLogin">
        <div class="empty-panel">
          <h2>专业书籍销售管理系统</h2>
          <p>请先返回首页完成登录。登录成功后，可以浏览、搜索和购买专业书籍。</p>
        </div>
      </template>

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

              <p v-if="hasDownloadRight" style="color: #2c6e8f; font-size: 0.9rem;">
                购买权限：已开通
              </p>

              <p v-else style="color: #a0a8b0; font-size: 0.9rem;">
                购买权限：未开通
              </p>
            </div>
          </div>

          <div>
            <h1>专业书籍销售</h1>
          </div>

          <button class="logout-btn" @click="logout">
            退出登录
          </button>
        </div>

        <div class="book-search-box">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入书名或作者"
            clearable
            style="width: 220px;"
          />

          <el-select
            v-model="searchForm.category"
            placeholder="请选择分类"
            clearable
            style="width: 180px;"
          >
            <el-option label="管理信息系统" value="管理信息系统" />
            <el-option label="数据库" value="数据库" />
            <el-option label="数据分析" value="数据分析" />
            <el-option label="创新管理" value="创新管理" />
            <el-option label="论文写作" value="论文写作" />
          </el-select>

          <button class="btn-submit" type="button" @click="handleSearch">
            搜索
          </button>

          <button class="btn-cancel" type="button" @click="resetSearch">
            重置
          </button>
        </div>

        <div class="book-grid">
          <div
            v-for="book in pagedBookData"
            :key="book.id"
            class="book-card"
          >
            <div class="book-cover">
              <div class="cover-title">
                {{ book.bookName }}
              </div>
            </div>

            <div class="book-text">
              <h3>{{ book.bookName }}</h3>

              <p>
                <strong>作者：</strong>{{ book.author }}
              </p>

              <p>
                <strong>出版社：</strong>{{ book.publisher }}
              </p>

              <p>
                <strong>分类：</strong>{{ book.category }}
              </p>

              <p>
                <strong>价格：</strong>
                <span class="book-price">￥{{ book.price.toFixed(2) }}</span>
              </p>

              <p>
                <strong>库存：</strong>
                <span v-if="book.stock > 0">{{ book.stock }}</span>
                <span v-else class="stock-empty">缺货</span>
              </p>

              <p class="book-description">
                {{ book.description }}
              </p>

              <div class="book-action">
                <button
                  v-if="hasDownloadRight"
                  class="small-buy-btn"
                  type="button"
                  :disabled="book.stock <= 0"
                  @click="openBuyDialog(book)"
                >
                  立即购买
                </button>

                <span
                  v-else
                  class="download-disabled"
                  title="当前用户没有购买权限"
                >
                  购买
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-wrap">
          <el-pagination
            background
            layout="prev, pager, next, jumper, total"
            :page-size="pageSize"
            :total="filteredBooks.length"
            v-model:current-page="currentPage"
          />
        </div>
      </template>
    </div>

    <div class="right-forms">
      <div class="tile login-tile">
        <h3>用户状态</h3>

        <template v-if="isLogin">
          <div style="text-align: center; margin-bottom: 16px;">
            <img
              :src="getAvatarUrl(currentUser?.avatar)"
              alt="用户头像"
              style="width: 78px; height: 78px; border-radius: 50%; object-fit: cover;"
              @error="e => e.target.src = defaultAvatar"
            />
          </div>

          <p>
            <strong>当前用户：</strong>
            {{ currentUser?.usrName }}
          </p>

          <p>
            <strong>QQ号：</strong>
            {{ currentUser?.qqnum || '未填写' }}
          </p>

          <p>
            <strong>地址：</strong>
            {{ currentUser?.address || '未填写' }}
          </p>

          <p v-if="hasDownloadRight" style="color: #2c6e8f;">
            购买权限：已开通
          </p>

          <p v-else style="color: #a0a8b0;">
            购买权限：未开通
          </p>
        </template>

        <template v-else>
          <div class="login-status not-login">
            当前未登录
          </div>
        </template>
      </div>

      <div class="tile info-tile">
        <h3>我的订单</h3>

        <template v-if="orderList.length === 0">
          <p class="info-text">
            暂无订单。购买专业书籍后，订单会显示在这里。
          </p>
        </template>

        <template v-else>
          <div
            v-for="order in orderList"
            :key="order.orderNo"
            class="order-card"
          >
            <p>
              <strong>订单号：</strong>{{ order.orderNo }}
            </p>
            <p>
              <strong>书籍：</strong>{{ order.bookName }}
            </p>
            <p>
              <strong>数量：</strong>{{ order.quantity }}
            </p>
            <p>
              <strong>金额：</strong>￥{{ order.totalAmount.toFixed(2) }}
            </p>
            <p>
              <strong>状态：</strong>
              <span style="color: #2c6e8f;">{{ order.status }}</span>
            </p>
          </div>
        </template>
      </div>

      <div class="tile info-tile">
        <h3>系统说明</h3>
        <p class="info-text">
          本模块用于模拟图书销售管理。当前版本为前端演示版，后续可以接入后端数据库，实现图书管理、订单管理和库存扣减。
        </p>
      </div>
    </div>

    <el-dialog
      v-model="buyDialogVisible"
      title="确认购买"
      width="430px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedBook" class="dialog-form">
        <div class="form-item">
          <label>书籍名称</label>
          <input type="text" :value="selectedBook.bookName" disabled />
        </div>

        <div class="form-item">
          <label>单价</label>
          <input type="text" :value="'￥' + selectedBook.price.toFixed(2)" disabled />
        </div>

        <div class="form-item">
          <label>购买数量</label>
          <el-input-number
            v-model="buyForm.quantity"
            :min="1"
            :max="selectedBook.stock"
            style="width: 100%;"
          />
        </div>

        <div class="form-item">
          <label>收货人</label>
          <input
            type="text"
            v-model="buyForm.receiverName"
            placeholder="请输入收货人"
          />
        </div>

        <div class="form-item">
          <label>联系电话</label>
          <input
            type="text"
            v-model="buyForm.receiverPhone"
            placeholder="请输入联系电话"
          />
        </div>

        <div class="form-item">
          <label>收货地址</label>
          <input
            type="text"
            v-model="buyForm.receiverAddress"
            placeholder="请输入收货地址"
          />
        </div>

        <p style="font-weight: bold; color: #2c6e8f;">
          订单金额：￥{{ orderAmount.toFixed(2) }}
        </p>

        <div class="dialog-buttons">
          <button type="button" class="btn-submit" @click="submitOrder">
            提交订单
          </button>

          <button type="button" class="btn-cancel" @click="closeBuyDialog">
            取消
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['logout-success'])

const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: '',
  category: ''
})

const buyDialogVisible = ref(false)
const selectedBook = ref(null)

const buyForm = reactive({
  quantity: 1,
  receiverName: '',
  receiverPhone: '',
  receiverAddress: ''
})

const orderList = ref([])

const isLogin = computed(() => {
  return !!props.currentUser
})

const currentUser = computed(() => {
  return props.currentUser
})

const hasDownloadRight = computed(() => {
  return Number(currentUser.value?.downloadRight || 0) > 0
})

const bookList = ref([
  {
    id: 1,
    bookName: '管理信息系统',
    author: '黄梯云',
    publisher: '高等教育出版社',
    category: '管理信息系统',
    price: 49.8,
    stock: 30,
    description: '系统介绍管理信息系统的概念、开发方法、系统分析与系统设计。'
  },
  {
    id: 2,
    bookName: '数据库系统概论',
    author: '王珊',
    publisher: '高等教育出版社',
    category: '数据库',
    price: 59.0,
    stock: 20,
    description: '数据库课程经典教材，涵盖关系模型、SQL语言和数据库设计。'
  },
  {
    id: 3,
    bookName: 'Python数据分析基础',
    author: '张明',
    publisher: '清华大学出版社',
    category: '数据分析',
    price: 69.0,
    stock: 18,
    description: '介绍 Python 在数据处理、统计分析和可视化中的基本应用。'
  },
  {
    id: 4,
    bookName: '创新管理',
    author: '陈劲',
    publisher: '北京大学出版社',
    category: '创新管理',
    price: 56.0,
    stock: 16,
    description: '介绍企业创新战略、技术创新管理和组织创新机制。'
  },
  {
    id: 5,
    bookName: '学术论文写作与规范',
    author: '李华',
    publisher: '中国人民大学出版社',
    category: '论文写作',
    price: 42.0,
    stock: 25,
    description: '介绍论文选题、文献综述、研究设计和学术规范。'
  },
  {
    id: 6,
    bookName: '信息系统分析与设计',
    author: '刘伟',
    publisher: '机械工业出版社',
    category: '管理信息系统',
    price: 52.0,
    stock: 12,
    description: '围绕信息系统开发流程，讲解需求分析、建模和系统设计。'
  },
  {
    id: 7,
    bookName: '数据可视化实战',
    author: '赵强',
    publisher: '电子工业出版社',
    category: '数据分析',
    price: 66.0,
    stock: 10,
    description: '介绍数据图表设计、可视化表达和分析报告制作。'
  },
  {
    id: 8,
    bookName: '管理学原理',
    author: '周三多',
    publisher: '复旦大学出版社',
    category: '管理信息系统',
    price: 48.0,
    stock: 22,
    description: '管理类专业基础教材，介绍计划、组织、领导和控制等内容。'
  },
  {
    id: 9,
    bookName: 'SQL数据库开发实践',
    author: '孙磊',
    publisher: '人民邮电出版社',
    category: '数据库',
    price: 63.0,
    stock: 14,
    description: '面向数据库应用开发，介绍 SQL 查询、表设计和事务处理。'
  },
  {
    id: 10,
    bookName: '数字化转型管理',
    author: '吴晓波',
    publisher: '浙江大学出版社',
    category: '创新管理',
    price: 58.0,
    stock: 19,
    description: '围绕企业数字化转型，介绍战略规划、组织变革和数据驱动管理。'
  },
  {
    id: 11,
    bookName: '大数据管理与应用',
    author: '李强',
    publisher: '科学出版社',
    category: '数据分析',
    price: 72.0,
    stock: 15,
    description: '介绍大数据平台、数据治理、数据分析方法与管理应用场景。'
  },
  {
    id: 12,
    bookName: '管理研究方法',
    author: '陈晓萍',
    publisher: '北京大学出版社',
    category: '论文写作',
    price: 65.0,
    stock: 11,
    description: '系统讲解管理学研究中的问题提出、理论建构、变量测量和实证分析。'
  }
])

const filteredBooks = computed(() => {
  let result = bookList.value

  const keyword = searchForm.keyword.trim().toLowerCase()
  const category = searchForm.category

  if (keyword) {
    result = result.filter(item => {
      return (
        item.bookName.toLowerCase().includes(keyword) ||
        item.author.toLowerCase().includes(keyword)
      )
    })
  }

  if (category) {
    result = result.filter(item => item.category === category)
  }

  return result
})

const pagedBookData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  return filteredBooks.value.slice(start, end)
})

const orderAmount = computed(() => {
  if (!selectedBook.value) {
    return 0
  }

  return selectedBook.value.price * buyForm.quantity
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

avatarList.value.sort((a, b) => {
  return parseInt(a.value) - parseInt(b.value)
})

const defaultAvatar =
  avatarImages['/src/assets/image/default.jpg'] ||
  avatarList.value[0]?.img ||
  ''

function getAvatarUrl(filename) {
  if (!filename) {
    return defaultAvatar
  }

  const found = avatarList.value.find(item => item.value === filename)

  return found ? found.img : defaultAvatar
}

function handleSearch() {
  currentPage.value = 1
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.category = ''
  currentPage.value = 1
}

function openBuyDialog(row) {
  if (!hasDownloadRight.value) {
    ElMessage.warning('当前用户没有购买权限')
    return
  }

  if (row.stock <= 0) {
    ElMessage.warning('该图书库存不足')
    return
  }

  selectedBook.value = row

  buyForm.quantity = 1
  buyForm.receiverName = currentUser.value?.usrName || ''
  buyForm.receiverPhone = currentUser.value?.qqnum || ''
  buyForm.receiverAddress = currentUser.value?.address || ''

  buyDialogVisible.value = true
}

function closeBuyDialog() {
  buyDialogVisible.value = false
  selectedBook.value = null
}

function submitOrder() {
  if (!selectedBook.value) {
    return
  }

  if (!buyForm.receiverName.trim()) {
    ElMessage.warning('请输入收货人')
    return
  }

  if (!buyForm.receiverPhone.trim()) {
    ElMessage.warning('请输入联系电话')
    return
  }

  if (!buyForm.receiverAddress.trim()) {
    ElMessage.warning('请输入收货地址')
    return
  }

  if (buyForm.quantity > selectedBook.value.stock) {
    ElMessage.warning('库存不足')
    return
  }

  const orderNo = 'BOOK' + Date.now()

  orderList.value.unshift({
    orderNo,
    bookId: selectedBook.value.id,
    bookName: selectedBook.value.bookName,
    price: selectedBook.value.price,
    quantity: buyForm.quantity,
    totalAmount: orderAmount.value,
    receiverName: buyForm.receiverName,
    receiverPhone: buyForm.receiverPhone,
    receiverAddress: buyForm.receiverAddress,
    status: '已下单'
  })

  selectedBook.value.stock -= buyForm.quantity

  ElMessage.success('订单提交成功')

  closeBuyDialog()
}

function logout() {
  localStorage.removeItem('currentUser')
  localStorage.removeItem('token')

  emit('logout-success')

  ElMessage.info('已退出登录')
}
</script>

<style scoped>
.book-search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0 18px;
  padding: 14px;
  background: #f7f9fb;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-wrap: wrap;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.book-card {
  min-height: 176px;
  padding: 14px;
  border: 1px solid #d9e2ec;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 3px 12px rgba(20, 60, 90, 0.06);
  overflow: hidden;
}

.book-card::after {
  content: "";
  display: block;
  clear: both;
}

.book-cover {
  float: left;
  width: 92px;
  height: 128px;
  margin: 0 14px 8px 0;
  border-radius: 8px;
  background: linear-gradient(145deg, #2c6e8f, #5fa7c2);
  box-shadow: 0 5px 14px rgba(44, 110, 143, 0.25);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  text-align: center;
}

.cover-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 1px;
}

.book-text h3 {
  margin: 0 0 7px;
  color: #1e4663;
  font-size: 1.08rem;
}

.book-text p {
  margin: 4px 0;
  color: #4f5f69;
  font-size: 0.92rem;
  line-height: 1.6;
}

.book-price {
  color: #c0392b;
  font-weight: 700;
}

.stock-empty {
  color: #c0392b;
  font-weight: 700;
}

.book-description {
  text-align: justify;
}

.book-action {
  margin-top: 8px;
  text-align: right;
}

.small-buy-btn {
  padding: 6px 13px;
  border: none;
  border-radius: 18px;
  background-color: #2c6e8f;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.small-buy-btn:hover {
  background-color: #245a75;
}

.small-buy-btn:disabled {
  background-color: #b8c2cc;
  cursor: not-allowed;
}

.order-card {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background-color: #f8fbfd;
  font-size: 13px;
}

.order-card p {
  margin: 4px 0;
}

@media (max-width: 900px) {
  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>