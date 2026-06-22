const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const res = await db.collection('votes')
      .orderBy('createTime', 'desc')
      .get()

    const now = Date.now()
    const votes = res.data.map(vote => {
      vote.commentCount = vote.commentCount || 0
      if (vote.endDate) {
        const endTime = new Date(vote.endDate).getTime()
        if (now > endTime && vote.status === 'active') {
          vote.status = 'ended'
        }
      }
      return vote
    })

    return {
      success: true,
      data: votes
    }
  } catch (err) {
    console.error('获取投票列表失败:', err)
    return {
      success: false,
      message: err.message || '获取失败'
    }
  }
}