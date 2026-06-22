// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { voteId, selectedOptions, userNickName, userAvatar } = event
  
  // 参数校验
  if (!voteId) {
    return {
      success: false,
      message: '缺少投票ID'
    }
  }
  
  if (!selectedOptions || selectedOptions.length === 0) {
    return {
      success: false,
      message: '请选择至少一个选项'
    }
  }
  
  try {
    // 检查是否已经投过票
    const recordCheck = await db.collection('vote_records')
      .where({
        voteId: voteId,
        userOpenId: openid
      })
      .count()
    
    if (recordCheck.total > 0) {
      return {
        success: false,
        message: '您已经投过票了'
      }
    }
    
    // 获取投票详情
    const voteRes = await db.collection('votes').doc(voteId).get()
    
    if (!voteRes.data) {
      return {
        success: false,
        message: '投票不存在'
      }
    }
    
    const vote = voteRes.data
    
    // 检查投票是否已结束
    if (vote.status !== 'active') {
      return {
        success: false,
        message: '投票已结束'
      }
    }
    
    // 检查是否过期
    if (vote.endDate) {
      const endTime = new Date(vote.endDate).getTime()
      if (Date.now() > endTime) {
        // 更新状态
        await db.collection('votes').doc(voteId).update({
          data: { status: 'ended' }
        })
        return {
          success: false,
          message: '投票已结束'
        }
      }
    }
    
    // 更新选项票数
    const newOptions = vote.options.map((opt, index) => {
      if (selectedOptions.includes(index)) {
        return {
          ...opt,
          votes: (opt.votes || 0) + 1
        }
      }
      return opt
    })
    
    // 更新投票记录
    await db.collection('votes').doc(voteId).update({
      data: {
        options: newOptions,
        totalVoters: vote.totalVoters + 1
      }
    })
    
    // 记录用户投票
    await db.collection('vote_records').add({
      data: {
        voteId: voteId,
        userOpenId: openid,
        userNickName: userNickName || '',
        userAvatar: userAvatar || '',
        selectedOptions: selectedOptions,
        voteTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '投票成功'
    }
  } catch (err) {
    console.error('提交投票失败:', err)
    return {
      success: false,
      message: err.message || '投票失败'
    }
  }
}
