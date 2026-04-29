<script setup>
import { ref,computed } from 'vue'
import axios from 'axios'

const flag=ref(true);
const insertColor=ref('white');

//表单模型
const user = ref({
  id: '',
  username: '',
  password: '',
  qqnum: ''
})

//表格数据
const tableData=ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const pageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableData.value.slice(start, start + pageSize.value);
});

//切换插入按钮的显示状态
function toggleFlag() {
  flag.value = !flag.value;
  if(flag.value)
  {
    insertColor.value='white';
  }
  else
  {
    insertColor.value='grey';
  } 
  
}

//分页显示数据
function show()
{
  axios.get('http://localhost:8080/api/select').
  then(res=>{
    tableData.value=res.data;
    console.log("数据获取成功!!!")
 
    
    
  })
}

//插入新数据
function insert(){

  
  if(user.value.id === '' || user.value.username === '' || user.value.password === '' || user.value.qqnum === '') {
    
    alert("请填写完整信息");
    return;
  }
 
  axios.post('http://localhost:8080/api/insert',{
    usrId: user.value.id,
    usrName: user.value.username,
    password: user.value.password,
    qqnum: user.value.qqnum
  }).
  then(res=>{
    console.log(res.data);
    alert("插入成功");
    toggleFlag();
  })
  
}
//更新数据
function update(){
  axios.post('http://localhost:8080/api/update',{
    id: user.value.id,
    username: user.value.username,
    password: user.value.password,
    qqnum: user.value.qqnum
  }).
  then(res=>{
    console.log(res.data);
    alert("更新成功");
  })
}
//删除数据
function del(){
  axios.post('http://localhost:8080/api/delete',{
    id: user.value.id
  }).
  then(res=>{
    console.log(res.data);
    alert("删除成功");
  })
}


//登录界面处理
function send(){

  axios.post('http://localhost:8080/api/loadup',{
    usrName: user.value.username,
    password: user.value.password
  }).
  then(res=>{
    console.log(res.data[0].usrName);
  
    alert(res.data[0].usrName);
  })
  .catch(err=>{
    console.error(err);
  })
}

</script>
<template>
<div class="rounded-lg">
    <header>
     <h1 style="color:white;padding: 10px;">用户管理系统</h1>
    </header>
    <nav>
      <ul class="site-nav">
        <li><a href="/">Home</a></li>
        <li>
          <a @click="show()">显示</a>
        </li>
        <li>
          <a @click="update()">更新</a>
        </li>
        <li>
          <a :style="{backgroundColor:insertColor}" @click="toggleFlag">插入</a>
        </li>
        <li class="nav-right">
          <a @click="del()">删除</a>
        </li>
      </ul>
    </nav>
    <main class="flex">
      <div class="column-main tile rounded-lg">
        
        <el-table :data="pageData" stripe border style="width: 100%">

          <el-table-column prop="usrId" label="用户编号"  align="center"></el-table-column>
          <el-table-column prop="usrName" label="用户姓名"  align="center"></el-table-column>
          <el-table-column prop="password" label="用户密码"  align="center"></el-table-column>
          <el-table-column prop="qqnum" label="联系方式"  align="center"></el-table-column>

        </el-table>
        <el-pagination
  background
  layout="prev, pager, next"
  :page-size="pageSize"
  :total="tableData.length"
  v-model:current-page="currentPage"
  v-model:page-size="pageSize"
  @current-change="val => currentPage = val"
  @size-change="val => pageSize = val">
</el-pagination>

      </div>
      <div class="column-sidebar">
        <div class="tile rounded-lg">
          <form  @submit.prevent="send">
            <h3>Login</h3>
            <p>
              <label for="username">用户名：</label>
              <input id="username" type="text" v-model="user.username"
                name="username"/>
            </p>
            <p>
              <label for="password">密码：&emsp;</label>
              <input id="password" type="password" v-model="user.password"
                name="password"/>
            </p>
            <button type="submit" class="bg-green-200 text-black pl-4 pr-4 rounded-lg">登录</button>
          </form>
        </div>
        
        <div class="tile centered rounded-lg">
          <small>插入新的用户数据</small>
          
          <form @submit.prevent="insert" class="my-form">
            <p>
              <label for="new-username">新编号：</label>
              <input id="new-username" type="text" v-model="user.id"
                name="new-id"/>
            </p>
            <p>
              <label for="new-name">用户名：</label>
              <input id="new-name" type="text" v-model="user.username"
                name="new-username"/>
            </p>
            <p>
              <label for="new-password">密码：&emsp;</label>
              <input id="new-password" type="password" v-model="user.password"
                name="new-password"/>
            </p>
            <p>
              <label for="new-qqnum">联系号：</label>
              <input id="new-qqnum" type="text" v-model="user.qqnum"
                name="new-qqnum"/>
            </p>
           
            <div class="button-group">
            <button type="submit" :disabled="flag">插入</button>
            <button class="bg-blue-500 rounded-lg mt-0 p-2 text-white" type="reset" @click="user={id:'',username:'',password:'',qqnum:''}">重置</button>
            </div>
          

          </form>



          <a class="cta-button" href="/pricing">
            Sign up
          </a>
        </div>
      
      
      
      </div>
    </main>
  </div>
 

  </template>
  <style scoped>
.site-nav{
  display: flex;
  padding: 0.5em;
  list-style-type: none;
  background-color: bisque;
  border-radius: .2em;
  font-weight: bold;

}
.site-nav > li {
  margin-top: 0;
}
.site-nav > li + li{
  margin-left: 1.5em;
}
.site-nav > .nav-right {
  margin-left: auto;
}
.site-nav > li > a {
  background-color:aquamarine;
  color:black;
  text-decoration: none;
  display: block;
  padding: 0.5em 1em;
}
.tile {
  padding: 1.5em;
  background-color: aliceblue;
}
.flex {
  display: flex;
}
.flex > * + * {
  margin-top: 0;
  margin-left: 1.5em;
}
.column-main {
  flex: 2;
}
.column-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.column-sidebar > .tile{
  flex: 1;
}
small{
  font-weight: bold;
}
a{
  cursor: pointer;
}
.button-group {
  display: flex;
  justify-content: center;
  gap: 1.5em; /* 按钮间距，可选 */
}
.my-form > p{
  margin: .5em 0;
}
</style>