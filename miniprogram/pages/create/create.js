const app = getApp()

Page({
  data: {
    title: '',
    description: '',
    options: ['', ''],
    voteType: 'single',
    endDate: '',
    isAnonymous: false
  },

  onTitleInput: function (e) {
    this.setData({
      title: e.detail.value
    })
  },

  onDescInput: function (e) {
    this.setData({
      description: e.detail.value
    })
  },

  onOptionInput: function (e) {
    const index = e.currentTarget.dataset.index
    const options = [...this.data.options]
    options[index] = e.detail.value
    this.setData({
      options: options
    })
  },

  addOption: function () {
    if (this.data.options.length < 6) {
      this.setData({
        options: [...this.data.options, '']
      })
    }
  },

  deleteOption: function (e) {
    const index = e.currentTarget.dataset.index
    if (this.data.options.length > 2) {
      const options = this.data.options.filter((_, i) => i !== index)
      this.setData({
        options: options
      })
    }
  },

  setVoteType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      voteType: type
    })
  },

  onDateChange: function (e) {
    this.setData({
      endDate: e.detail.value
    })
  },

  onAnonymousChange: function (e) {
    this.setData({
      isAnonymous: e.detail.value
    })
  },

  submitVote: function () {
    const { title, options } = this.data
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入投票标题',
        icon: 'none'
      })
      return
    }

    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) {
      wx.showToast({
        title: '至少需要2个选项',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '发布中...'
    })

    app.addVote({
      title: title.trim(),
      description: this.data.description.trim(),
      options: validOptions.map(opt => ({
        text: opt.trim(),
        votes: 0
      })),
      voteType: this.data.voteType,
      endDate: this.data.endDate || null,
      isAnonymous: this.data.isAnonymous,
      creatorName: '用户' + Math.floor(Math.random() * 10000)
    })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      this.setData({
        title: '',
        description: '',
        options: ['', ''],
        voteType: 'single',
        endDate: '',
        isAnonymous: false
      })
    }, 500)
  }
})