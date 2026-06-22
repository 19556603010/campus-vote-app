const app = getApp()

const COMMENT_PAGE_SIZE = 10

Page({
  data: {
    vote: null,
    selectedOptions: [],
    hasVoted: false,
    loading: true,
    // 评论相关
    comments: [],
    commentCount: 0,
    commentInput: '',
    loadingComments: false,
    hasMoreComments: true,
    commentPage: 1,
    voters: [],
    loadingVoters: false,
    myOpenId: '',
    myNickName: ''
  },

  onLoad: function (options) {
    const id = options.id
    this.setData({
      myOpenId: (app.globalData && app.globalData.openid) || '',
      myNickName: ((app.globalData && app.globalData.userInfo) || {}).nickName || ''
    })
    if (id) {
      this.loadVote(id)
    }
  },

  onShow: function () {
    this.setData({
      myOpenId: (app.globalData && app.globalData.openid) || '',
      myNickName: ((app.globalData && app.globalData.userInfo) || {}).nickName || ''
    })
  },

  loadVote: async function (id) {
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getVoteDetail',
        data: { voteId: id }
      })

      if (res.result && res.result.data) {
        const vote = res.result.data
        this.setData({
          vote: vote,
          commentCount: vote.commentCount || 0,
          loading: false
        })
        this.checkIfVoted(id)
        this.loadComments(id, 1, true)
        this.loadVoters(id)
      } else {
        wx.showToast({
          title: '投票不存在',
          icon: 'none'
        })
        this.setData({ loading: false })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (err) {
      console.error('加载投票详情失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  checkIfVoted: async function (voteId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'checkVoteRecord',
        data: { voteId: voteId }
      })

      if (res.result && res.result.hasVoted) {
        this.setData({
          selectedOptions: res.result.selectedOptions || [],
          hasVoted: true
        })
      }
    } catch (err) {
      console.error('检查投票记录失败:', err)
    }
  },

  selectOption: function (e) {
    const { vote, hasVoted } = this.data
    if (!vote || vote.status !== 'active' || hasVoted) return

    const index = e.currentTarget.dataset.index

    if (vote.voteType === 'single') {
      this.setData({
        selectedOptions: [index]
      })
    } else {
      const selected = [...this.data.selectedOptions]
      const idx = selected.indexOf(index)
      if (idx > -1) {
        selected.splice(idx, 1)
      } else {
        selected.push(index)
      }
      this.setData({
        selectedOptions: selected
      })
    }
  },

  submitVote: async function () {
    const { vote, selectedOptions } = this.data

    if (selectedOptions.length === 0) {
      wx.showToast({
        title: '请选择至少一个选项',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '投票中...'
    })

    try {
      const myInfo = (app.globalData && app.globalData.userInfo) || {}
      const res = await wx.cloud.callFunction({
        name: 'submitVote',
        data: {
          voteId: vote._id,
          selectedOptions: selectedOptions,
          userNickName: myInfo.nickName || '',
          userAvatar: myInfo.avatarUrl || ''
        }
      })

      wx.hideLoading()

      if (res.result && res.result.success) {
        wx.showToast({
          title: '投票成功',
          icon: 'success'
        })

        this.setData({
          hasVoted: true
        })

        this.loadVote(vote._id)
      } else {
        wx.showToast({
          title: res.result.message || '投票失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('提交投票失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '投票失败',
        icon: 'none'
      })
    }
  },

  getPercentage: function (votes) {
    const { vote } = this.data
    if (!vote || vote.totalVoters === 0) return 0
    return Math.round((votes / vote.totalVoters) * 100)
  },

  formatTime: function (date) {
    if (!date) return ''
    let d
    if (typeof date === 'object' && date && date.$date) {
      d = new Date(date.$date)
    } else {
      d = new Date(date)
    }
    if (isNaN(d.getTime())) return ''
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
  },

  loadVoters: async function (voteId) {
    const { vote } = this.data
    if (!vote || (vote.isAnonymous && vote.status !== 'ended')) return

    this.setData({ loadingVoters: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getVoteRecords',
        data: { voteId: voteId }
      })
      if (res.result && res.result.success) {
        this.setData({
          voters: res.result.list || []
        })
      }
    } catch (err) {
      console.error('加载参与者列表失败:', err)
    }
    this.setData({ loadingVoters: false })
  },

  getOptionText: function (selectedOptions) {
    const { vote } = this.data
    if (!vote || !selectedOptions || !vote.options) return []
    return selectedOptions.map(idx => {
      return vote.options[idx] ? vote.options[idx].text : '未知选项'
    })
  },

  shareVote: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage: function () {
    const { vote } = this.data
    if (!vote) {
      return {}
    }
    return {
      title: vote.title,
      path: `/pages/detail/detail?id=${vote._id}`,
      imageUrl: vote.coverImage || '',
      success: function () {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        })
      },
      fail: function () {
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        })
      }
    }
  },

  onShareTimeline: function () {
    const { vote } = this.data
    if (!vote) {
      return {}
    }
    return {
      title: vote.title,
      query: `id=${vote._id}`,
      imageUrl: vote.coverImage || ''
    }
  },

  // ============ 评论相关 ============

  onCommentInput: function (e) {
    this.setData({ commentInput: e.detail.value })
  },

  loadComments: async function (voteId, page, reset) {
    this.setData({ loadingComments: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getComments',
        data: { voteId: voteId, page: page, pageSize: COMMENT_PAGE_SIZE }
      })
      if (res.result && res.result.success) {
        const list = res.result.list || []
        const merged = reset ? list : this.data.comments.concat(list)
        this.setData({
          comments: merged,
          commentPage: page,
          hasMoreComments: !!res.result.hasMore,
          loadingComments: false
        })
      } else {
        this.setData({ loadingComments: false })
      }
    } catch (err) {
      console.error('加载评论失败:', err)
      this.setData({ loadingComments: false })
    }
  },

  loadMoreComments: function () {
    if (this.data.loadingComments || !this.data.hasMoreComments || !this.data.vote) return
    this.loadComments(this.data.vote._id, this.data.commentPage + 1, false)
  },

  submitComment: async function () {
    const content = (this.data.commentInput || '').trim()
    if (!content) {
      wx.showToast({ title: '评论内容不能为空', icon: 'none' })
      return
    }
    if (!this.data.vote) return

    wx.showLoading({ title: '发送中...' })
    try {
      const myInfo = (app.globalData && app.globalData.userInfo) || {}
      const res = await wx.cloud.callFunction({
        name: 'addComment',
        data: {
          voteId: this.data.vote._id,
          content: content,
          userNickName: myInfo.nickName || '',
          userAvatar: myInfo.avatarUrl || ''
        }
      })
      wx.hideLoading()
      if (res.result && res.result.success) {
        // 乐观更新:把刚发的评论插到列表顶部
        const newComment = {
          _id: res.result._id,
          _openid: this.data.myOpenId,
          voteId: this.data.vote._id,
          userOpenId: this.data.myOpenId,
          userNickName: myInfo.nickName || '我',
          userAvatar: myInfo.avatarUrl || '',
          content: content,
          createTime: new Date()
        }
        this.setData({
          comments: [newComment].concat(this.data.comments),
          commentInput: '',
          commentCount: res.result.commentCount || (this.data.commentCount + 1)
        })
        wx.showToast({ title: '已发送', icon: 'success' })
      } else {
        wx.showToast({ title: res.result.message || '发送失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('提交评论失败:', err)
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  },

  deleteComment: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.showModal({
      title: '删除评论',
      content: '确定要删除这条评论吗?',
      success: async (res) => {
        if (!res.confirm) return
        try {
          const r = await wx.cloud.callFunction({
            name: 'deleteComment',
            data: { commentId: id }
          })
          if (r.result && r.result.success) {
            const list = this.data.comments.filter(c => c._id !== id)
            this.setData({
              comments: list,
              commentCount: r.result.commentCount != null ? r.result.commentCount : Math.max(0, this.data.commentCount - 1)
            })
            wx.showToast({ title: '已删除', icon: 'success' })
          } else {
            wx.showToast({ title: r.result.message || '删除失败', icon: 'none' })
          }
        } catch (err) {
          console.error('删除评论失败:', err)
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  }
})
