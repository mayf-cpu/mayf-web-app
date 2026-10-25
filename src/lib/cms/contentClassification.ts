import type {StudentClass} from '../firebase/types';
export const CONTENT_GRADES: StudentClass[] = ['Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
/** Subjects and topics are independent of the selected grades. Values remain CMS-compatible. */
export const SUBJECT_TOPICS: Record<string,string[]> = {
 'Number System':['Real Numbers','Integers','Fractions & Decimals','Rational Numbers','Exponents & Powers','Surds & Indices','HCF & LCM'],
 'Arithmetic':['Percentages','Ratio & Proportion','Profit & Loss','Simple & Compound Interest','Speed, Distance & Time'],
 'Fractions':['Fractions & Decimals','Operations on Fractions','Fraction to Percentage'],
 'Algebra':['Polynomials','Linear Equations','Quadratic Equations','Arithmetic Progressions','Algebraic Expressions & Identities','Mock Papers'],
 'Geometry':['Lines & Angles','Triangles','Circles','Constructions','Quadrilaterals'],
 'Coordinate Geometry':['Cartesian Plane','Distance Formula','Section Formula','Area of Triangle'],
 'Trigonometry':['Trigonometric Ratios','Identities','Heights & Distances'],
 'Mensuration':['Surface Areas and Volumes','Conversion of Solids','Area Related to Circles'],
 'Statistics':['Data Handling','Mean, Median & Mode','Grouped Data'],
 'Probability':['Probability of Events','Sample Spaces','Complementary Events'],
};
export function toggleContentGrade(selected:string[],grade:StudentClass):string[]{
 return selected.includes(grade)?selected.filter(value=>value!==grade):CONTENT_GRADES.filter(value=>value===grade||selected.includes(value));
}
