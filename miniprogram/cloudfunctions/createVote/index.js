// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const {
    title,
    description,
    options,
    voteType,
    endDate,
    isAnonymous,
    creatorName,
    coverImage
  } = event
  
  // 参数校验
  if (!title || title.trim() === '') {
    return {
      success: false,
      message: '请输入投票标题'
    }
  }
  
  if (!options || options.length < 2) {
    return {
      success: false,
      message: '至少需要2个选项'
    }
  }
  
  // 过滤空选项
  const validOptions = options.filter(opt => opt.text && opt.text.trim() !== '')
  if (validOptions.length < 2) {
    return {
      success: false,
      message: '至少需要2个有效选项'
    }
  }
  
  try {
    // 创建投票
    const voteData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      options: validOptions,
      voteType: voteType || 'single',
      endDate: endDate || null,
      isAnonymous: isAnonymous || false,
      creatorName: creatorName || '匿名用户',
      creatorOpenId: openid,
      createTime: db.serverDate(),
      totalVoters: 0,
      status: 'active',
      coverImage: coverImage || null
    }
    
    const res = await db.collection('votes').add({
      data: voteData
    })
    
    return {
      success: true,
      _id: res._id,
      message: '创建成功'
    }
  } catch (err) {
    console.error('创建投票失败:', err)
    return {
      success: false,
      message: err.message || '创建失败'
    }
  }
}
