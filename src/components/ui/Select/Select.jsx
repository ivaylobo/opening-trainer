import styles from './Select.module.css'

export default function Select({
  options,
  value,
  onChange,
  className = '',
  ...props
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string'
      ? { value: option, label: option }
      : {
          value: String(option.value),
          label: option.label,
        },
  )

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <select
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.caret} aria-hidden="true" />
    </div>
  )
}
