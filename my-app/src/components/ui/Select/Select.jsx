import styles from './Select.module.css'

export default function Select({
  options,
  value,
  onChange,
  className = '',
  ...props
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <select
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className={styles.caret} aria-hidden="true" />
    </div>
  )
}
