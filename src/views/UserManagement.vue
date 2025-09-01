<template>
  <div class="user-management">
    <el-card>
      <!-- 返回按钮区域 -->
      <div class="header-actions">
        <el-button 
          type="default" 
          icon="ArrowLeft" 
          @click="$router.push('/home')"
          class="back-button"
        >
          返回首页
        </el-button>
        
        <div class="card-header">
          <h2>用户管理</h2>
          <el-button type="primary" @click="handleAddUser">新增用户</el-button>
        </div>
      </div>
      
      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleId" placeholder="请选择角色">
            <el-option 
              v-for="role in roleList" 
              :key="role.roleId" 
              :label="role.roleName" 
              :value="role.roleId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getUserList">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 用户表格 -->
      <el-table :data="userList" border>
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="realName" label="真实姓名" />
        <el-table-column prop="roleName" label="角色" />
        <el-table-column label="状态" prop="status">
          <template #default="scope">
            <!-- 修正：active-value 和 inactive-value 改为数值类型（1/0，无引号） -->
            <el-switch
              v-model="scope.row.status"
              :active-value="1"  
              :inactive-value="0"  
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="权限" width="120">
          <template #default="scope">
            <el-button 
              type="text" 
              @click="handleAssignPerms(scope.row)"
              v-if="scope.row.roleId"
            >
              分配权限
            </el-button>
            <span v-else>无角色</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="text" @click="handleEditUser(scope.row)">编辑</el-button>
            <el-button type="text" danger @click="handleDeleteUser(scope.row.userId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 1. 用户表单对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      :width="500"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item 
          label="密码" 
          prop="password"
          v-if="dialogType === 'add'"
        >
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select 
            v-model="form.roleId" 
            placeholder="请选择角色"
            @change="handleRoleChange"
          >
            <el-option 
              v-for="role in roleList" 
              :key="role.roleId" 
              :label="role.roleName" 
              :value="role.roleId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <!-- 用户表单中的状态开关 数值类型 -->
          <el-switch 
            v-model="form.status" 
            :active-value="1"  
            :inactive-value="0"  
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 2. 权限分配对话框-->
    <el-dialog 
      v-model="permDialogVisible" 
      title="角色权限分配" 
      :width="600"
    >
      <div class="perm-container">
        <el-tree
          :data="permissionTree"
          show-checkbox
          node-key="permId"
          ref="permTreeRef"
          :default-checked-keys="checkedPermIds"
          :props="{ label: 'permName', children: 'children' }"
        />
      </div>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePerms">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { userApi } from '@/api/userManagementApi' 
import { roleApi, permissionApi } from '@/api/userManagementApi' 
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

// 基础数据（保持不变，仅修正status的类型相关逻辑）
const searchForm = ref({ username: '', roleId: '' })
const roleList = ref([]) 
const userList = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 })

// 用户表单相关
const dialogVisible = ref(false)
const dialogType = ref('add')
// 修正：form.status 默认值改为数值1（而非字符串"1"）
const form = ref({ userId: '', username: '', realName: '', password: '', roleId: '', status: 1 }) 
const rules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6 }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
})
const formRef = ref(null)

// 权限分配相关（保持不变）
const permDialogVisible = ref(false)
const permTreeRef = ref(null)
const permissionList = ref([])
const permissionTree = ref([])
const checkedPermIds = ref([])
const currentRoleId = ref(null)

// 获取所有角色（保持不变）
const getRoleList = async () => {
  try {
    const res = await roleApi.list()
    if (res.code === 200) {
      roleList.value = res.data || []
    } else {
      roleList.value = []
      ElMessage.warning('获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色失败:', error)
    ElMessage.error('获取角色数据失败')
  }
}

// 获取用户列表（保持不变）
const getUserList = async () => {
  try {
    const params = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      username: searchForm.value.username,
      roleId: searchForm.value.roleId
    }
    const res = await userApi.list(params)
    if (res.code === 200 && res.data) {
      userList.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      userList.value = []
      pagination.total = 0
      ElMessage.warning('获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户失败:', error)
    ElMessage.error('获取用户数据失败')
  }
}

// 获取所有权限并构建树形结构（保持不变）
const getPermissionList = async () => {
  try {
    const res = await permissionApi.list()
    if (res.code === 200) {
      permissionList.value = res.data || []
      permissionTree.value = buildPermissionTree(permissionList.value)
    } else {
      permissionList.value = []
      permissionTree.value = []
      ElMessage.warning('获取权限列表失败')
    }
  } catch (error) {
    console.error('获取权限失败:', error)
    ElMessage.error('获取权限数据失败')
  }
}

// 构建权限树形结构（保持不变）
const buildPermissionTree = (permissions) => {
  const modules = {}
  permissions.forEach(perm => {
    const module = perm.module || '未分类'
    if (!modules[module]) {
      modules[module] = { permId: module, permName: module, children: [] }
    }
    modules[module].children.push(perm)
  })
  return Object.values(modules)
}

// 获取角色已有权限ID（保持不变）
const getRolePermissions = async (roleId) => {
  try {
    const res = await roleApi.getPerms(roleId)
    if (res.code === 200) {
      return res.data.map(perm => perm.permId)
    } else {
      return []
    }
  } catch (error) {
    console.error('获取角色权限失败:', error)
    return []
  }
}

// 角色切换时联动获取权限（保持不变）
const handleRoleChange = async (roleId) => {
  if (!roleId) return
  if (dialogType.value === 'edit') {
    const perms = await getRolePermissions(roleId)
    console.log('当前角色权限:', perms)
  }
}

// 分配权限按钮点击事件（保持不变）
const handleAssignPerms = async (row) => {
  if (!row.roleId) {
    ElMessage.warning('该用户未分配角色，无法分配权限')
    return
  }
  currentRoleId.value = row.roleId
  permDialogVisible.value = true
  checkedPermIds.value = await getRolePermissions(row.roleId)
}

// 保存权限分配（保持不变）
const handleSavePerms = async () => {
  if (!currentRoleId.value) return
  const selectedPermIds = permTreeRef.value.getCheckedKeys()
  try {
    const res = await roleApi.assignPerms({
      roleId: currentRoleId.value,
      permIds: selectedPermIds
    })
    if (res.code === 200) {
      ElMessage.success('权限分配成功')
      permDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '权限分配失败')
    }
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('权限保存失败')
  }
}

// 用户状态切换（修正：确保传递的status是数值类型）
const handleStatusChange = async (row) => {
  try {
    // 此时row.status已为数值类型（1或0），无需额外转换
    const updateData = { userId: row.userId, status: row.status } 
    const res = await userApi.update(updateData)
    if (res.code !== 200) {
      // 失败回滚（数值类型）
      row.status = row.status === 1 ? 0 : 1 
      ElMessage.error(res.msg || '状态更新失败')
    } else {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1 // 回滚数值类型
    ElMessage.error('状态更新失败')
  }
}

// 用户表单提交（保持不变）
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const res = dialogType.value === 'add' 
      ? await userApi.add(form.value) 
      : await userApi.update(form.value)
    if (res.code === 200) {
      ElMessage.success(dialogType.value === 'add' ? '用户添加成功' : '用户更新成功')
      dialogVisible.value = false
      getUserList()
    } else {
      ElMessage.error(res.msg || (dialogType.value === 'add' ? '用户添加失败' : '用户更新失败'))
    }
  } catch (error) {
    console.error('表单提交失败:', error)
  }
}

// 其他方法（分页、删除、重置等，保持不变）
const resetSearch = () => {
  searchForm.value = { username: '', roleId: '' }
  getUserList()
}
const handleSizeChange = (size) => { pagination.pageSize = size; getUserList() }
const handleCurrentChange = (page) => { pagination.currentPage = page; getUserList() }
const handleAddUser = () => {
  dialogType.value = 'add'
  // 修正：form.status 默认值为数值1
  form.value = { userId: '', username: '', realName: '', password: '', roleId: '', status: 1 }
  dialogVisible.value = true
}
const handleEditUser = (row) => {
  dialogType.value = 'edit'
  // 确保status是数值类型（row.status从后端返回是数值）
  form.value = { ...row, password: '', status: row.status } 
  dialogVisible.value = true
}
const handleDeleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '确认删除', { type: 'warning' })
    const res = await userApi.delete(userId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getUserList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
  }
}

// 初始化（保持不变）
onMounted(async () => {
  await Promise.all([
    getRoleList(),    
    getUserList(),    
    getPermissionList()
  ])
})
</script>

<style scoped>
/* 样式保持不变 */
.header-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}
.back-button {
  align-self: flex-start;
  margin-bottom: 8px;
}
.user-management {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
.perm-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}
.el-tree {
  margin-top: 10px;
}
</style>