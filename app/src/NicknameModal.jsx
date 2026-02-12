import { useState } from 'react'

function NicknameModal({ onSubmit }) {
    const [name, setName] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const trimmed = name.trim()
        if (trimmed.length > 0 && trimmed.length <= 12) {
            onSubmit(trimmed)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-emoji">👋</div>
                <h2 className="modal-title">歡迎來好哇！</h2>
                <p className="modal-desc">取個暱稱加入排行榜吧</p>
                <form onSubmit={handleSubmit}>
                    <input
                        className="modal-input"
                        type="text"
                        placeholder="你的暱稱..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={12}
                        autoFocus
                    />
                    <button
                        className="modal-btn"
                        type="submit"
                        disabled={name.trim().length === 0}
                    >
                        好哇！開始 🎉
                    </button>
                </form>
            </div>
        </div>
    )
}

export default NicknameModal
