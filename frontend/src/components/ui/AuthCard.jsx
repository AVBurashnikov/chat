import styles from './AuthCard.module.css';

export const AuthCard = ({
  title,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSwitch,
  submitLabel,
  loadingLabel,
  switchLabel,
  loading,
  error,
  success,
  passwordAutoComplete,
}) => {
  return (
    <div className={styles.page}>
      <form onSubmit={onSubmit} className={styles.card}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Логин</label>
          <input
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className={styles.input}
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={styles.input}
            disabled={loading}
            autoComplete={passwordAutoComplete}
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button
          type="submit"
          className={`${styles.submitButton} ${loading ? styles.submitButtonDisabled : ''}`}
          disabled={loading}
        >
          {loading ? loadingLabel : submitLabel}
        </button>

        <button
          type="button"
          onClick={onSwitch}
          className={styles.switchButton}
          disabled={loading}
        >
          {switchLabel}
        </button>
      </form>
    </div>
  );
};
