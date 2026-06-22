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
      message: '缺少投票ID'
    }
  }
  
  try {
    // 获取投票信息
    const voteRes = await db.collection('votes').doc(voteId).get()
    
    if (!voteRes.data) {
      return {
        success: false,
        message: '投票不存在'
      }
    }
    
    const vote = voteRes.data
    
    // 权限检查：只有创建者可以删除
    if (vote.creatorOpenId !== openid) {
      return {
        success: false,
        message: '只有创建者可以删除投票'
      }
    }
    
    // 删除投票
    await db.collection('votes').doc(voteId).remove()

    // 删除相关的投票记录
    const records = await db.collection('vote_records')
      .where({ voteId: voteId })
      .get()

    if (records.data && records.data.length > 0) {
      const batch = db.database().batch()
      records.data.forEach(record => {
        batch.delete(db.collection('vote_records').doc(record._id))
      })
      await batch.commit()
    }

    // 🆕 级联删除相关的评论
    try {
      const comments = await db.collection('comments')
        .where({ voteId: voteId })
        .limit(100)
        .get()
      if (comments.data && comments.data.length > 0) {
        const batch = db.database().batch()
        comments.data.forEach(c => {
          batch.delete(db.collection('comments').doc(c._id))
        })
        await batch.commit()
      }
    } catch (cmtErr) {
      // comments 集合可能尚未创建,容错
      console.warn('级联删除评论失败(可能 comments 集合不存在):', cmtErr.message)
    }

    return {
      success: true,
      message: '删除成功'
    }
  } catch (err) {
    console.error('删除投票失败:', err)
    return {
      success: false,
      message: err.message || '删除失败'
    }
  }
}
