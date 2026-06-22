// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { voteId } = event
  
  if (!voteId) {
    return {
      success: false,
      message: '缺少投票ID'
    }
  }
  
  try {
    const res = await db.collection('votes').doc(voteId).get()
    
    if (!res.data) {
      return {
        success: false,
        message: '投票不存在'
      }
    }
    
    // 检查投票状态
    const vote = res.data
    const now = Date.now()
    
    if (vote.endDate) {
      const endTime = new Date(vote.endDate).getTime()
      if (now > endTime && vote.status === 'active') {
        // 更新为已结束
        await db.collection('votes').doc(voteId).update({
          data: { status: 'ended' }
        })
        vote.status = 'ended'
      }
    }
    
    return {
      success: true,
      data: vote
    }
  } catch (err) {
    console.error('获取投票详情失败:', err)
    return {
      success: false,
      message: err.message || '获取失败'
    }
  }
}
