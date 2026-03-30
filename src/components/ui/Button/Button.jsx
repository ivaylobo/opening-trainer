import styles from './Button.module.css'

export default function Button({
  variant = 'default',
  tone,
  className = '',
  type = 'button',
  ...props
}) {
  const classes = [styles.button, styles[variant], tone ? styles[tone] : null, className]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} type={type} {...props} />
}
