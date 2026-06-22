// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { voteId } = event
  
  if (!voteId) {
    return {
      success: false,
      hasVoted: false
    }
  }
  
  try {
    const res = await db.collection('vote_records')
      .where({
        voteId: voteId,
        userOpenId: openid
      })
      .get()
    
    if (res.data && res.data.length > 0) {
      return {
        success: true,
        hasVoted: true,
        selectedOptions: res.data[0].selectedOptions
      }
    }
    
    return {
      success: true,
      hasVoted: false
    }
  } catch (err) {
    console.error('检查投票记录失败:', err)
    return {
      success: false,
      hasVoted: false
    }
  }
}
