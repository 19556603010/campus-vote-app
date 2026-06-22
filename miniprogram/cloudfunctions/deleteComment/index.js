// 云函数 deleteComment - 删除自己的评论
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { commentId } = event || {}

  if (!commentId) {
    return { success: false, message: '缺少评论ID' }
  }

  try {
    const cmtRes = await db.collection('comments').doc(commentId).get().catch(() => null)
    if (!cmtRes || !cmtRes.data) {
      return { success: false, message: '评论不存在' }
    }
    const cmt = cmtRes.data
    // 服务端二次鉴权
    if (cmt._openid !== openid) {
      return { success: false, message: '只能删除自己的评论' }
    }

    // 物理删除
    await db.collection('comments').doc(commentId).remove()

    // 维护 votes.commentCount
    const voteId = cmt.voteId
    let commentCount = 0
    if (voteId) {
      const decRes = await db.collection('votes').doc(voteId).update({
        data: { commentCount: _.inc(-1) }
      }).catch(() => null)
      if (decRes && decRes.stats && decRes.stats.updated > 0) {
        const after = await db.collection('votes').doc(voteId).field({ commentCount: true }).get()
        commentCount = (after.data && after.data.commentCount) || 0
      } else {
        commentCount = Math.max(0, (cmt.commentCount || 1) - 1)
      }
    }

    return { success: true, commentCount: commentCount, message: '删除成功' }
  } catch (err) {
    console.error('删除评论失败:', err)
    return { success: false, message: err.message || '删除失败' }
  }
}
