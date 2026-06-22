// 云函数 addComment - 提交评论
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { voteId, content, userNickName, userAvatar } = event || {}

  if (!voteId) {
    return { success: false, message: '缺少投票ID' }
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return { success: false, message: '评论内容不能为空' }
  }
  const trimmed = content.trim()
  if (trimmed.length > 500) {
    return { success: false, message: '评论内容不能超过500字' }
  }

  try {
    // 校验投票存在
    const voteRes = await db.collection('votes').doc(voteId).get().catch(() => null)
    if (!voteRes || !voteRes.data) {
      return { success: false, message: '投票不存在' }
    }

    // 写入评论
    const addRes = await db.collection('comments').add({
      data: {
        voteId: voteId,
        userOpenId: openid,
        userNickName: (userNickName || '').toString().slice(0, 20),
        userAvatar: (userAvatar || '').toString().slice(0, 500),
        content: trimmed,
        parentId: '',
        likeCount: 0,
        status: 'normal',
        createTime: db.serverDate()
      }
    })

    // 维护 votes.commentCount(原子 inc)
    const incRes = await db.collection('votes').doc(voteId).update({
      data: { commentCount: _.inc(1) }
    }).catch(err => {
      // 旧文档可能没有 commentCount 字段,先补字段
      return db.collection('votes').doc(voteId).update({
        data: { commentCount: 1 }
      })
    })

    const updated = incRes && incRes.stats ? incRes.stats.updated : 0
    let commentCount = 0
    if (updated > 0) {
      const after = await db.collection('votes').doc(voteId).field({ commentCount: true }).get()
      commentCount = (after.data && after.data.commentCount) || 0
    } else {
      commentCount = (voteRes.data.commentCount || 0) + 1
    }

    return {
      success: true,
      _id: addRes._id,
      commentCount: commentCount,
      message: '评论成功'
    }
  } catch (err) {
    console.error('提交评论失败:', err)
    return { success: false, message: err.message || '评论失败' }
  }
}
