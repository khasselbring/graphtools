#!/bin/bash

mkdir -p output_svg
mkdir -p output_jpg
mkdir -p output_pdf

for file in $(echo *.csv); do
    gnuplot <<EOF
    set datafile separator ','
    set title "${file} Plot"
    set key autotitle columnheader
	firstrow = system('head -1 ' . "$file")
	set xlabel substr(firstrow, 0, strstrt(firstrow, ",") - 1)
	set ylabel substr(firstrow, strstrt(firstrow, ",") + 1, strlen(firstrow))
    set terminal svg
    set output "output_svg/" . substr("${file}", 0, strstrt("${file}", ".csv") - 1) . ".svg"
    plot "$file" u 1:2 w lines
    set terminal jpeg
    set output "output_jpg/" . substr("${file}", 0, strstrt("${file}", ".csv") - 1) . ".jpg"
    plot "$file" u 1:2 w lines
    set terminal pdf
    set output "output_pdf/" . substr("${file}", 0, strstrt("${file}", ".csv") - 1) . ".pdf"
    plot "$file" u 1:2 w lines
EOF
done
