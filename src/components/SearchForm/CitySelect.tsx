import type { City } from '../../api';
import styles from './SearchForm.module.css';

type CitySelectProps = {
  label: string;
  name: string;
  value: string;
  cities: City[];
  testId: string;
  onChange: (code: string) => void;
};

export function CitySelect({
  label,
  name,
  value,
  cities,
  testId,
  onChange,
}: CitySelectProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId}
      >
        {cities.map((city) => (
          <option key={city.code} value={city.code}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}
