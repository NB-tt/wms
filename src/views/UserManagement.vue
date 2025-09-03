<template>

  <div class="user-management">

    <el-card>

      <!-- 顶部操作按钮和标签页 -->
      <div class="header-actions">
        <el-button
          type="default"
          icon="ArrowLeft"
          @click="$router.push('/home')"
          class="back-button"
        >
          返回首页
        </el-button>

        <!-- 标签页：用户管理 / 角色管理 -->
        <el-tabs v-model="activeTab" class="tabs-container">
          <el-tab-pane label="用户管理" name="user">
            <!-- 用户管理内容 -->
            <div class="card-header">
              <h2>用户管理</h2>
              <el-button type="primary" @click="handleAddUser">新增用户</el-button>
            </div>

            <!-- 用户搜索表单 -->
            <el-form :inline="true" :model="searchForm" class="search-form">
              <el-form-item label="用户名">
                <el-input v-model="searchForm.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="角色">
                <el-select
                  v-model="searchForm.roleId"
                  placeholder="请选择角色"
                  clearable
                >
                  <el-option
                    v-for="role in roleList"
                    :key="role.roleId"
                    :label="role.roleName"
                    :value="Number(role.roleId)"
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
              <el-table-column prop="department" label="所属部门" />
              <el-table-column prop="phone" label="联系电话" width="140">
                <template #default="scope">
                  {{ scope.row.phone || '未填写' }}
                </template>
              </el-table-column>
              <el-table-column prop="roleName" label="角色" />
              <el-table-column label="状态">
                <template #default="scope">
                  <el-switch
                    v-model="scope.row.status"
                    :active-value="1"
                    :inactive-value="0"
                    @change="handleStatusChange(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button type="text" @click="handleEditUser(scope.row)">编辑</el-button>
                  <el-button type="text" danger @click="handleDeleteUser(scope.row.userId)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 用户分页 -->
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
          </el-tab-pane>

          <el-tab-pane label="角色管理" name="role">
            <!-- 角色管理内容 -->
            <div class="card-header">
              <h2>角色管理</h2>
              <el-button type="success" @click="handleAddRole">新增角色</el-button>
            </div>

            <!-- 角色表格（新增，含删除按钮） -->
            <el-table :data="roleList" border>
              <el-table-column prop="roleId" label="角色ID" width="80" />
              <el-table-column prop="roleName" label="角色名称" />
              <el-table-column prop="description" label="角色描述">
                <template #default="scope">
                  {{ scope.row.description || '无描述' }}
                </template>
              </el-table-column>
              <el-table-column label="权限数量" width="120">
                <template #default="scope">
                  {{ scope.row.permissionCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240">
                <template #default="scope">
                  <el-button type="text" @click="handleEditRole(scope.row)">编辑</el-button>
                  <el-button type="text" @click="handleAssignPerms(scope.row)">分配权限</el-button>
                  <el-button
                    type="text"
                    danger
                    @click="handleDeleteRole(scope.row)"
                    :disabled="scope.row.isSystemRole"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogType === 'add' ? '新增用户' : '编辑用户'"
      :width="500"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="userDialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-input v-model="userForm.department" placeholder="请输入所属部门（如：行政部）" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入联系电话（选填，如：13800138000）"
            maxlength="20"
          />
          <div class="hint-text">提示：联系电话为选填，仅支持数字和“-”</div>
        </el-form-item>

        <!-- 【修改点1】编辑用户时显示密码框（支持修改密码） -->
        <el-form-item
          label="密码"
          prop="password"
          :rules="userDialogType === 'edit' ? editPasswordRules : userRules.password"
        >
          <el-input v-model="userForm.password" type="password" />
          <!-- 【修改点2】编辑时添加提示文字 -->
          <div v-if="userDialogType === 'edit'" class="hint-text">
            提示：如需修改密码，请输入至少6位新密码；不修改请留空
          </div>
        </el-form-item>

        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="userForm.roleId"
            placeholder="请选择角色"
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
          <el-switch
            v-model="userForm.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUserSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      :title="roleDialogType === 'add' ? '新增角色' : '编辑角色'"
      :width="600"
    >
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称（如：仓库管理员）" />
          <div v-if="roleNameError" class="error-tip">{{ roleNameError }}</div>
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" rows="3" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="权限分配">
          <div class="perm-container">
            <el-tree
              :data="permissionTree"
              show-checkbox
              node-key="permId"
              ref="rolePermTreeRef"
              :default-checked-keys="roleCheckedPermIds"
              :props="{ label: 'permName', children: 'children' }"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 角色删除确认对话框 -->
    <el-dialog
      v-model="roleDeleteDialogVisible"
      title="确认删除角色"
      :width="400"
      :close-on-click-modal="false"
    >
      <div>
        <p>确定删除角色 <strong style="color: #ff4d4f;">{{ currentRoleName }}</strong> 吗？</p>
        <p class="delete-tip">提示：如果该角色已分配给用户，请先移除关联用户</p>
      </div>
      <template #footer>
        <el-button @click="roleDeleteDialogVisible = false">取消</el-button>
        <el-button type="primary" danger @click="confirmDeleteRole">确认删除</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
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
import { userApi, roleApi, permissionApi } from '@/api/userManagementApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

// 新增：标签页切换（用户管理/角色管理）
const activeTab = ref('user') // 默认显示用户管理

// 搜索表单
const searchForm = ref({
  username: '',
  roleId: null
})

// 基础数据
const roleList = ref([])
const userList = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 })

// 用户表单相关
const userDialogVisible = ref(false)
const userDialogType = ref('add')
const userForm = ref({
  userId: '',
  username: '',
  realName: '',
  department: '',
  password: '',
  roleId: null,
  status: 1,
  phone: ''
})
const userRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入所属部门', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  phone: [
    {
      pattern: /^[0-9-]{0,20}$/,
      message: '请输入有效的联系电话（仅支持数字和“-”）',
      trigger: 'blur'
    }
  ]
})

// 【修改点3】编辑用户的密码规则（可选填，输入时校验长度）
const editPasswordRules = ref([
  { min: 6, message: '密码至少6位', trigger: 'blur', required: false }
])

const userFormRef = ref(null)

// 角色表单相关
const roleDialogVisible = ref(false)
const roleDialogType = ref('add')
const roleForm = ref({ roleId: null, roleName: '', description: '' })
const roleRules = ref({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
})
const roleFormRef = ref(null)
const rolePermTreeRef = ref(null)
const roleCheckedPermIds = ref([])
const roleNameError = ref('')

// 角色删除相关
const roleDeleteDialogVisible = ref(false)
const currentRoleId = ref(null)
const currentRoleName = ref('')
const currentRoleIsSystem = ref(false)

// 权限分配相关
const permDialogVisible = ref(false)
const permTreeRef = ref(null)
const permissionList = ref([])
const permissionTree = ref([])
const checkedPermIds = ref([])

// 初始化加载数据
onMounted(async () => {
  await Promise.all([
    getRoleList(),
    getUserList(),
    getPermissionList()
  ])
})

// 获取角色列表（新增：统计权限数量 + 标记系统角色）
const getRoleList = async () => {
  try {
    const res = await roleApi.list()
    if (res.code === 200) {
      const roles = res.data || []
      // 为每个角色附加权限数量和系统角色标记
      for (const role of roles) {
        const perms = await getRolePermissions(role.roleId)
        role.permissionCount = perms.length
        // 标记系统角色（假设角色名称为 'system_admin' 或 ID=1 为系统角色）
        role.isSystemRole = role.roleName === 'system_admin' || role.roleId === 1
      }
      roleList.value = roles
    } else {
      roleList.value = []
      ElMessage.warning('获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色失败:', error)
    ElMessage.error('获取角色数据失败')
  }
}

// 获取用户列表
const getUserList = async () => {
  try {
    const params = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      username: searchForm.value.username.trim(),
      roleId: searchForm.value.roleId ? Number(searchForm.value.roleId) : null
    }
    const res = await userApi.list(params)
    if (res.code === 200 && res.data) {
      userList.value = res.data.records.map(user => ({
        ...user,
        userId: Number(user.userId),
        roleId: user.roleId ? Number(user.roleId) : null
      }))
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

// 获取权限列表并构建树形结构
const getPermissionList = async () => {
  try {
    const res = await permissionApi.list()
    if (res.code === 200) {
      permissionList.value = res.data || []
      buildPermissionTree()
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

// 构建权限树形结构
const buildPermissionTree = () => {
  const treeData = []
  const parentMap = new Map()
  permissionList.value.forEach(perm => {
    perm.children = []
    parentMap.set(perm.permId, perm)
    if (perm.parentId === 0 || !perm.parentId) {
      treeData.push(perm)
    }
  })
  permissionList.value.forEach(perm => {
    if (perm.parentId !== 0 && perm.parentId) {
      const parent = parentMap.get(perm.parentId)
      if (parent) parent.children.push(perm)
    }
  })
  permissionTree.value = treeData
}

// 新增用户
const handleAddUser = () => {
  userDialogType.value = 'add'
  userForm.value = {
    userId: '',
    username: '',
    realName: '',
    department: '',
    password: '',
    roleId: roleList.value.length > 0 ? roleList.value[0].roleId : null,
    status: 1,
    phone: ''
  }
  userDialogVisible.value = true
}

// 编辑用户
const handleEditUser = (row) => {
  userDialogType.value = 'edit'
  userForm.value = {
    ...row,
    password: '', // 【修改点4】编辑时密码默认空，留空不修改
    roleId: Number(row.roleId)
  }
  userDialogVisible.value = true
}

// 【修改点5】提交用户表单（编辑时若密码为空，不传递password字段）
const handleUserSubmit = async () => {
  if (!userFormRef.value) return
  try {
    await userFormRef.value.validate()
    // 构造提交数据（编辑时若密码为空，删除password字段）
    const submitData = { ...userForm.value }
    if (userDialogType.value === 'edit' && !submitData.password.trim()) {
      delete submitData.password // 编辑且密码为空 → 不传递password字段
    }
    // 角色ID转为数字，处理空字符串电话
    submitData.roleId = Number(submitData.roleId)
    submitData.phone = submitData.phone.trim() || null

    const res = userDialogType.value === 'add'
      ? await userApi.add(submitData)
      : await userApi.update(submitData)

    if (res.code === 200) {
      ElMessage.success(`${userDialogType.value === 'add' ? '新增' : '编辑'}用户成功`)
      userDialogVisible.value = false
      getUserList()
    } else {
      ElMessage.error(res.msg || `${userDialogType.value === 'add' ? '新增' : '编辑'}用户失败`)
    }
  } catch (error) {
    console.error('用户表单提交失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  }
}

// 新增角色
const handleAddRole = () => {
  roleDialogType.value = 'add'
  roleForm.value = { roleId: null, roleName: '', description: '' }
  roleCheckedPermIds.value = []
  roleNameError.value = ''
  roleDialogVisible.value = true
  if (rolePermTreeRef.value) rolePermTreeRef.value.setCheckedKeys([])
}

// 编辑角色
const handleEditRole = async (row) => {
  roleDialogType.value = 'edit'
  roleForm.value = {
    roleId: row.roleId,
    roleName: row.roleName,
    description: row.description
  }
  // 获取角色已有权限
  roleCheckedPermIds.value = await getRolePermissions(row.roleId)
  roleNameError.value = ''
  roleDialogVisible.value = true
}

// 角色名称查重
watch(() => roleForm.value.roleName, async (newVal) => {
  if (!newVal) {
    roleNameError.value = ''
    return
  }
  try {
    const res = await roleApi.checkRoleName(newVal.trim())
    if (res.code === 200 && res.data.exists) {
      roleNameError.value = '角色名称已存在，请更换'
    } else {
      roleNameError.value = ''
    }
  } catch (error) {
    console.error('校验角色名称失败:', error)
  }
})

// 提交角色表单（支持新增和编辑）
const handleRoleSubmit = async () => {
  if (!roleFormRef.value) return
  if (roleNameError.value) {
    ElMessage.error('角色名称已存在，请修改')
    return
  }
  try {
    await roleFormRef.value.validate()
    const selectedPermIds = rolePermTreeRef.value.getCheckedKeys()
    if (selectedPermIds.length === 0) {
      ElMessage.warning('请至少选择一个权限')
      return
    }
    const roleData = {
      roleId: roleDialogType.value === 'edit' ? roleForm.value.roleId : null,
      roleName: roleForm.value.roleName.trim(),
      description: roleForm.value.description.trim()
    }
    let roleRes
    if (roleDialogType.value === 'add') {
      // 新增角色
      roleRes = await roleApi.create(roleData)
    } else {
      // 编辑角色
      roleRes = await roleApi.update(roleData)
    }
    if (roleRes.code !== 200) {
      ElMessage.error(`${roleDialogType.value === 'add' ? '新增' : '编辑'}角色失败: ` + (roleRes.msg || '未知错误'))
      return
    }
    // 分配权限（新增和编辑都需要重新分配权限）
    const targetRoleId = roleDialogType.value === 'add' ? roleRes.data.roleId : roleForm.value.roleId
    const permRes = await roleApi.assignPerms({
      roleId: targetRoleId,
      permIds: selectedPermIds.map(id => Number(id))
    })
    if (permRes.code === 200) {
      ElMessage.success(`${roleDialogType.value === 'add' ? '新增' : '编辑'}角色及权限成功`)
      roleDialogVisible.value = false
      getRoleList() // 刷新角色列表
    } else {
      ElMessage.error('权限分配失败: ' + (permRes.msg || '未知错误'))
    }
  } catch (error) {
    console.error('角色表单提交失败:', error)
    ElMessage.error('提交失败，请重试')
  }
}

// 打开角色删除确认框
const handleDeleteRole = (row) => {
  currentRoleId.value = row.roleId
  currentRoleName.value = row.roleName
  currentRoleIsSystem.value = row.isSystemRole
  roleDeleteDialogVisible.value = true
}

// 确认删除角色
const confirmDeleteRole = async () => {
  try {
    // 如果是系统角色，直接提示禁止删除
    if (currentRoleIsSystem.value) {
      ElMessage.error('系统内置角色禁止删除')
      roleDeleteDialogVisible.value = false
      return
    }
    const res = await roleApi.delete(currentRoleId.value)
    if (res.code === 200) {
      ElMessage.success('角色删除成功')
      roleDeleteDialogVisible.value = false
      getRoleList() // 刷新角色列表
      getUserList() // 刷新用户列表（可能有角色关联变化）
    } else {
      ElMessage.error(res.msg || '角色删除失败')
    }
  } catch (error) {
    console.error('删除角色失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

// 获取角色权限
const getRolePermissions = async (roleId) => {
  try {
    const res = await roleApi.getPerms(roleId)
    return res.code === 200 ? res.data.map(perm => perm.permId) : []
  } catch (error) {
    console.error('获取角色权限失败:', error)
    return []
  }
}

// 分配角色权限
const handleAssignPerms = async (row) => {
  currentRoleId.value = row.roleId
  currentRoleName.value = row.roleName
  permDialogVisible.value = true
  checkedPermIds.value = await getRolePermissions(row.roleId)
}

// 保存权限分配
const handleSavePerms = async () => {
  if (!currentRoleId.value) return
  try {
    const selectedPermIds = permTreeRef.value.getCheckedKeys()
    const res = await roleApi.assignPerms({
      roleId: currentRoleId.value,
      permIds: selectedPermIds.map(id => Number(id))
    })
    if (res.code === 200) {
      ElMessage.success('权限分配成功')
      permDialogVisible.value = false
      getRoleList() // 刷新角色权限数量
    } else {
      ElMessage.error(res.msg || '权限分配失败')
    }
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

// 修改用户状态（已修复）
const handleStatusChange = async (row) => {
  // 1. 记录切换前的旧状态（用于请求失败时回滚）
  const oldStatus = row.status
  // 2. 计算切换后的新状态（1 启用 → 0 禁用；0 禁用 → 1 启用）
  const newStatus = oldStatus === 1 ? 0 : 1
  try {
    // 3. 传递新状态给后端（修复：使用 newStatus 而非旧状态）
    const updateData = {
      userId: row.userId,  // 用户ID（正确传递）
      status: newStatus    // 新状态（修复：传递切换后的新值）
    }
    // 4. 调用后端接口更新状态
    const res = await userApi.updateStatus(updateData)
    if (res.code === 200) {
      // ✅ 请求成功：更新前端显示状态为新状态
      row.status = newStatus
      ElMessage.success('状态更新成功')
    } else {
      // ❌ 请求失败：回滚状态为切换前的旧值
      row.status = oldStatus
      ElMessage.error(res.msg || '状态更新失败')
    }
  } catch (error) {
    // ❌ 网络错误：回滚状态为切换前的旧值
    row.status = oldStatus
    console.error('状态更新网络错误:', error)
    ElMessage.error('网络错误，状态更新失败')
  }
}

// 删除用户
const handleDeleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    const res = await userApi.delete(userId)
    if (res.code === 200) {
      ElMessage.success('用户删除成功')
      getUserList()
    } else {
      ElMessage.error(res.msg || '用户删除失败')
    }
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败，请重试')
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    username: '',
    roleId: null
  }
  getUserList()
}

// 分页事件
const handleSizeChange = (size) => {
  pagination.pageSize = size
  getUserList()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  getUserList()
}

</script>

<style scoped>
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
.tabs-container {
  width: 100%;
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
  max-height: 300px;
  overflow-y: auto;
  padding-right: 10px;
  margin-top: 10px;
}
.el-tree {
  margin-top: 10px;
}
.error-tip {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
.hint-text {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
.delete-tip {
  color: #faad14;
  font-size: 13px;
  margin-top: 10px;
}
</style>