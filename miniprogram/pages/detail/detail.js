const app = getApp()

Page({
  data: {
    vote: null,
    selectedOptions: [],
    hasVoted: false
  },

  onLoad: function (options) {
    const id = options.id
    if (id) {
      this.loadVote(id)
    }
  },

  loadVote: function (id) {
    const vote = app.getVoteById(id)
    if (vote) {
      this.setData({
        vote: vote
      })
      this.loadVotedOptions(id)
    } else {
      wx.showToast({
        title: '投票不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  loadVotedOptions: function (voteId) {
    try {
      const votedData = wx.getStorageSync('votedOptions')
      if (votedData) {
        const votedMap = JSON.parse(votedData)
        if (votedMap[voteId]) {
          this.setData({
            selectedOptions: votedMap[voteId],
            hasVoted: true
          })
        }
      }
    } catch (e) {
      console.error('加载投票记录失败:', e)
    }
  },

  saveVotedOptions: function (voteId, options) {
    try {
      const votedData = wx.getStorageSync('votedOptions')
      const votedMap = votedData ? JSON.parse(votedData) : {}
      votedMap[voteId] = options
      wx.setStorageSync('votedOptions', JSON.stringify(votedMap))
    } catch (e) {
      console.error('保存投票记录失败:', e)
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

  submitVote: function () {
    const { vote, selectedOptions } = this.data
    
    if (selectedOptions.length === 0) {
      wx.showToast({
        title: '请选择至少一个选项',
        icon: 'none'
      })
      return
    }

    const newOptions = vote.options.map((opt, idx) => ({
      ...opt,
      votes: selectedOptions.includes(idx) ? opt.votes + 1 : opt.votes
    }))

    const updatedVote = app.updateVote(vote._id, {
      options: newOptions,
      totalVoters: vote.totalVoters + 1
    })

    if (updatedVote) {
      this.saveVotedOptions(vote._id, selectedOptions)
      
      wx.showToast({
        title: '投票成功',
        icon: 'success'
      })
      
      this.setData({
        hasVoted: true,
        vote: updatedVote
      })
    } else {
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
    const d = new Date(date)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  },

  shareVote: function () {
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    })
  }
})